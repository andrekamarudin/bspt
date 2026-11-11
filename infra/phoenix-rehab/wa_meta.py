"""GreenCloud Meta test-number webhook. No patient traffic, no message logs."""
import os
import hmac
import hashlib
import json
import re
from datetime import datetime, timezone
from fastapi import Request, BackgroundTasks
from fastapi.responses import Response
import httpx

PHONE = re.compile(r"^[1-9]\d{7,14}$")
SIG = re.compile(r"^sha256=[0-9a-f]{64}$")
LIMIT = 262144

def read_verify_token():
    """Return only the active verifier; its encrypted DB copy never reaches logs."""
    from app import setting, decrypt
    ciphertext=setting("wa_meta_verify_encrypted")
    if isinstance(ciphertext,str):
        value=decrypt(ciphertext.encode("ascii"))
        if len(value)>=30 and value!="[Encrypted record could not be decrypted. Check original Infisical key.]":
            return value
    return os.getenv("PHOENIX_WA_VERIFY_TOKEN","")


def install(app):
    from app import db
    with db() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS wa_events(
            message_hash TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            created TEXT NOT NULL,
            updated TEXT NOT NULL
        )""")

    def timestamp():
        return datetime.now(timezone.utc).isoformat()

    def allowed(sender):
        numbers = [v.strip().lstrip("+") for v in os.getenv("PHOENIX_WA_ALLOWED_TEST_NUMBERS","").split(",") if v.strip()]
        return bool(PHONE.fullmatch(sender)) and 0 < len(numbers) <= 5 and sender in numbers

    def claim(message_id):
        from app import KEY, db
        digest = hmac.new(KEY, message_id.encode(), hashlib.sha256).hexdigest()
        now = timestamp()
        with db() as con:
            con.execute("BEGIN IMMEDIATE")
            exists = con.execute("SELECT 1 FROM wa_events WHERE message_hash=?", (digest,)).fetchone()
            if exists:
                con.execute("COMMIT")
                return None
            con.execute("INSERT INTO wa_events VALUES (?, 'queued', ?, ?)", (digest, now, now))
            con.execute("COMMIT")
        return digest

    async def answer(digest, sender, message):
        from app import db, check_scope, public_context, build_policy, luna_call
        status = "failed"
        try:
            good, why = check_scope(message)
            if good:
                config = public_context()
                policy = build_policy(config) + "\nOnly respond to public clinic questions. Never ask for patient information, make bookings, or imply a booking is confirmed."
                reply, _ = await luna_call([
                    {"role": "system", "content": policy},
                    {"role": "user", "content": message}
                ], int(config["max_tokens"]))
            else:
                reply = why or "Please contact Phoenix Rehab directly."
            token = os.getenv("PHOENIX_WA_ACCESS_TOKEN","")
            if not token or os.getenv("PHOENIX_WA_SEND_ENABLED") != "true":
                status = "disabled"
                return
            version = os.getenv("PHOENIX_WA_GRAPH_VERSION", "v25.0")
            if not re.fullmatch(r"v\d{1,2}\.0", version):
                return
            url = "https://graph.facebook.com/" + version + "/" + os.environ["PHOENIX_WA_PHONE_NUMBER_ID"] + "/messages"
            async with httpx.AsyncClient(timeout=15) as client:
                r = await client.post(url, headers={"Authorization":"Bearer "+token},
                    json={"messaging_product":"whatsapp","recipient_type":"individual",
                          "to":sender,"type":"text","text":{"preview_url":False,"body":reply[:1550]}})
                r.raise_for_status()
            status = "sent"
        except Exception:
            # Do not log phone numbers, message text, tokens or model output.
            status = "failed"
        finally:
            with db() as con:
                con.execute("UPDATE wa_events SET status=?,updated=? WHERE message_hash=?",
                            (status,timestamp(),digest))

    @app.get("/api/whatsapp")
    async def handshake(request:Request):
        expected=read_verify_token()
        query=request.query_params
        challenge=query.get("hub.challenge","")
        if not expected:
            return Response("Not configured",status_code=503)
        if (query.get("hub.mode")!="subscribe" or not challenge or len(challenge)>256 or
            not hmac.compare_digest(expected,query.get("hub.verify_token",""))):
            return Response("Forbidden",status_code=403)
        return Response(challenge,media_type="text/plain",headers={"Cache-Control":"no-store"})

    @app.post("/api/whatsapp")
    async def event(request:Request,background:BackgroundTasks):
        secret=os.getenv("PHOENIX_WA_META_APP_SECRET","")
        if not secret:
            return Response("Not configured",status_code=503)
        if not request.headers.get("content-type","").startswith("application/json"):
            return Response("Unsupported",status_code=415)
        length=request.headers.get("content-length","0")
        try:
            if int(length)>LIMIT:return Response("Too large",status_code=413)
        except ValueError:
            return Response("Invalid length",status_code=400)
        body=await request.body()
        if len(body)>LIMIT:
            return Response("Too large",status_code=413)
        actual=request.headers.get("x-hub-signature-256","").lower()
        expected="sha256="+hmac.new(secret.encode(),body,hashlib.sha256).hexdigest()
        if not SIG.fullmatch(actual) or not hmac.compare_digest(actual,expected):
            return Response("Forbidden",status_code=403)
        try:
            data=json.loads(body)
        except Exception:
            return Response("Invalid JSON",status_code=400)
        if data.get("object")!="whatsapp_business_account":
            return Response("EVENT_RECEIVED",media_type="text/plain")
        if not os.getenv("PHOENIX_WA_ACCESS_TOKEN") or os.getenv("PHOENIX_WA_SEND_ENABLED")!="true":
            return Response("EVENT_RECEIVED",media_type="text/plain")
        phone=os.getenv("PHOENIX_WA_PHONE_NUMBER_ID","")
        for entry in (data.get("entry") or [])[:2]:
            for change in (entry.get("changes") or [])[:2]:
                value=change.get("value") or {}
                if change.get("field")!="messages" or str((value.get("metadata") or {}).get("phone_number_id"))!=phone:
                    continue
                for msg in (value.get("messages") or [])[:5]:
                    sender=str(msg.get("from",""))
                    mid=str(msg.get("id",""))
                    message=str((msg.get("text") or {}).get("body","")).strip()
                    if not (allowed(sender) and msg.get("type")=="text" and mid.startswith("wamid.") and 1<=len(message)<=1600):
                        continue
                    from app import KEY, count_and_limit
                    sender_id=hmac.new(KEY,("wa:"+sender).encode(),hashlib.sha256).hexdigest()
                    permitted,_=count_and_limit("wa-message:"+sender_id,24,86400)
                    if not permitted:continue
                    digest=claim(mid)
                    if digest:background.add_task(answer,digest,sender,message)
        return Response("EVENT_RECEIVED",media_type="text/plain",headers={"Cache-Control":"no-store"})
