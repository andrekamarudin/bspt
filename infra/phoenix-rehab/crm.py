"""Isolated Phoenix Rehab DEMO CRM, no patient medical records or vendor writes.

Names and E.164 contact values are encrypted at rest. Phone matching is keyed HMAC,
not plaintext or unsalted hash. Two known test identities are seeded by a separate
restricted runtime operation, never in the git repository or default application boot.
Web requires a single-use owner-issued identity claim, not a name or phone typed into
chat. Meta sender IDs are used only after signature validation and tester allowlisting.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import re
import secrets
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import Depends, HTTPException, Request
from fastapi.responses import JSONResponse

SG = timezone(timedelta(hours=8))
PHONE = re.compile(r"^[1-9]\d{7,14}$")
INVITE = re.compile(r"^[A-Za-z0-9_-]{30,96}$")
TEST_IDS = {"andre", "nigel"}
PILOT_ONLY = "demo_only"
MAX_ISSUED_INVITES_HOUR = 8
INVITE_TTL_SECONDS = 900


def _app():
    import app
    return app


def _path() -> Path:
    app = _app()
    return Path(os.getenv("PHOENIX_CRM_DEMO_DB_PATH") or
                str(app.DB_PATH.with_name("phoenix_crm_demo.db")))


def _db():
    path = _path()
    path.parent.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(path), isolation_level=None, timeout=7)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys=ON")
    con.execute("PRAGMA busy_timeout=7000")
    return con


def _at() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _fingerprint(label: str, value: str) -> str:
    return hmac.new(_app().KEY, ("crm:" + label + ":" + value).encode(),
                    hashlib.sha256).hexdigest()


def _encrypt(text: str) -> bytes:
    return _app().crypt(text)


def _decrypt(value: bytes) -> str:
    return _app().decrypt(value)


def initialize():
    with _db() as con:
        con.execute("PRAGMA journal_mode=WAL")
        con.executescript("""
        CREATE TABLE IF NOT EXISTS crm_schema_version(
            version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS crm_customers(
            id TEXT PRIMARY KEY,
            display_name_cipher BLOB NOT NULL,
            demo_role TEXT NOT NULL CHECK(demo_role IN ('tester','clinic_owner')),
            source TEXT NOT NULL CHECK(source='internal_pilot'),
            sgimed_patient_id TEXT,
            is_demo INTEGER NOT NULL CHECK(is_demo=1),
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS crm_contact_identities(
            id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL REFERENCES crm_customers(id),
            channel TEXT NOT NULL CHECK(channel='whatsapp'),
            normalized_hmac TEXT NOT NULL UNIQUE,
            encrypted_value BLOB NOT NULL,
            provenance TEXT NOT NULL,
            is_demo INTEGER NOT NULL CHECK(is_demo=1),
            created_at TEXT NOT NULL,
            UNIQUE(customer_id,channel)
        );
        CREATE TABLE IF NOT EXISTS crm_appointments(
            id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL REFERENCES crm_customers(id),
            location TEXT NOT NULL,
            service TEXT NOT NULL,
            practitioner TEXT NOT NULL,
            starts_at TEXT NOT NULL,
            ends_at TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('demo_only','demo_cancelled')),
            source TEXT NOT NULL CHECK(source='synthetic_seed'),
            sgimed_appointment_id TEXT,
            payment_status TEXT NOT NULL CHECK(payment_status='not_charged'),
            is_demo INTEGER NOT NULL CHECK(is_demo=1),
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS crm_appointments_customer_date
            ON crm_appointments(customer_id,starts_at);
        CREATE TABLE IF NOT EXISTS crm_contact_consents(
            customer_id TEXT PRIMARY KEY REFERENCES crm_customers(id),
            purpose TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('pilot_test_only','revoked')),
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS crm_web_invitations(
            token_hash TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL REFERENCES crm_customers(id),
            issued_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            used_at TEXT
        );
        CREATE TABLE IF NOT EXISTS crm_web_bindings(
            pilot_session_hash TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL REFERENCES crm_customers(id),
            linked_at TEXT NOT NULL,
            expires_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS crm_events(
            id TEXT PRIMARY KEY,
            customer_id TEXT REFERENCES crm_customers(id),
            event_type TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS crm_provider_mappings(
            id TEXT PRIMARY KEY,
            customer_id TEXT REFERENCES crm_customers(id),
            appointment_id TEXT REFERENCES crm_appointments(id),
            provider TEXT NOT NULL,
            external_id_cipher BLOB,
            verified_at TEXT,
            UNIQUE(provider,external_id_cipher)
        );
        INSERT OR IGNORE INTO crm_schema_version(version,applied_at)
            VALUES(1,datetime('now'));
        """)


def seed_test_person(code: str, name: str, phone: str, role: str):
    """Call solely as a controlled runtime operation, never from public endpoints."""
    if code not in TEST_IDS or role not in ("tester","clinic_owner"):
        raise ValueError("Only authorized internal pilot identities are supported.")
    if name != {"andre":"Andre", "nigel":"Nigel"}[code]:
        raise ValueError("Name does not match tester account.")
    if not PHONE.fullmatch(phone):
        raise ValueError("Provide E.164 digits without +.")
    initialize()
    customer_id = "demo-" + code
    now = _at()
    with _db() as con:
        con.execute("BEGIN IMMEDIATE")
        con.execute("""INSERT OR IGNORE INTO crm_customers VALUES(?,?,?,?,?,?,?)""",
                    (customer_id,_encrypt(name),role,"internal_pilot",None,1,now))
        con.execute("""INSERT OR IGNORE INTO crm_contact_identities
                    (id,customer_id,channel,normalized_hmac,encrypted_value,provenance,is_demo,created_at)
                    VALUES(?,?,?,?,?,?,?,?)""",
                    ("wa-"+code,customer_id,"whatsapp",_fingerprint("phone",phone),
                     _encrypt("+"+phone),"owner_provided_for_testing",1,now))
        con.execute("""INSERT OR IGNORE INTO crm_contact_consents
                    VALUES(?,?,?,?)""",
                    (customer_id,"internal_bot_identity_test","pilot_test_only",now))
        # Idempotent, clearly fictional appointment rows; never copied from SGiMED.
        today = datetime.now(SG).date()
        cases = (
            ("and01","andre","Serangoon","Demo physiotherapy consultation",
             "Demo clinician",7,14,45),
            ("and02","andre","Orchard","Demo follow-up consultation",
             "Demo clinician",15,11,45),
            ("nig01","nigel","Orchard","Demo clinic-owner consultation",
             "Demo clinician",9,10,45),
            ("nig02","nigel","Tampines","Demo follow-up consultation",
             "Demo clinician",18,15,45),
        )
        for ident,owner,branch,service,doctor,offset,hour,duration in cases:
            if owner!=code:
                continue
            starts=datetime.combine(today+timedelta(days=offset),
                                    datetime.min.time(),SG).replace(hour=hour)
            ends=starts+timedelta(minutes=duration)
            con.execute("""INSERT OR IGNORE INTO crm_appointments VALUES(
                ?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                ("sim-"+ident,customer_id,branch,service,doctor,
                 starts.isoformat(),ends.isoformat(),"demo_only",
                 "synthetic_seed",None,"not_charged",1,now))
        con.execute("COMMIT")


def _customer_row(customer_id: str):
    with _db() as con:
        return con.execute(
            "SELECT * FROM crm_customers WHERE id=? AND is_demo=1",
            (customer_id,)).fetchone()


def _public_profile(customer_id: str) -> dict | None:
    row=_customer_row(customer_id)
    if not row: return None
    with _db() as con:
        appointments=con.execute("""SELECT id,location,service,practitioner,
                                      starts_at,ends_at,status,source,payment_status
                                    FROM crm_appointments WHERE customer_id=? AND is_demo=1
                                    ORDER BY starts_at ASC LIMIT 12""",
                                 (customer_id,)).fetchall()
    # Provider-neutral bot bookings use the same customer but remain demo-only.
    # The table is installed lazily by booking_tools; older CRM DBs still load.
    with _db() as con:
        has_booking=con.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='crm_bot_bookings'").fetchone()
        if has_booking:
            bots=con.execute("""SELECT id,branch,service,starts_at,ends_at
                                 FROM crm_bot_bookings WHERE customer_id=? AND status='confirmed_simulation'
                                 ORDER BY confirmed_at DESC LIMIT 10""",(customer_id,)).fetchall()
            for item in bots:
                appointments.append({
                    "id":item["id"],"location":item["branch"],
                    "service":item["service"],"practitioner":"Not assigned",
                    "starts_at":item["starts_at"],"ends_at":item["ends_at"],
                    "status":"demo_only","source":"tool_call_simulation",
                    "payment_status":"not_charged"
                })
    return {
        "id":row["id"],"name":_decrypt(row["display_name_cipher"]),
        "demo_role":row["demo_role"],"source":"internal_pilot",
        "appointments":[dict(item) for item in appointments],
        "identity_scope":"demo_only",
        "notice":"All customer appointments here are fictional CRM test records, not SGiMED bookings."
    }


def _session_hash(request: Request) -> str:
    app=_app()
    cookie=request.cookies.get(app.PILOT_COOKIE,"")
    if not re.fullmatch(r"[a-f0-9]{64}",cookie) or not app.has_pilot_session(request):
        raise HTTPException(401,detail="Sign in to the Phoenix pilot first.")
    return _fingerprint("web-session", cookie)


def profile_from_web(request: Request) -> dict | None:
    try: token=_session_hash(request)
    except HTTPException: return None
    with _db() as con:
        row=con.execute("""SELECT customer_id FROM crm_web_bindings
                           WHERE pilot_session_hash=? AND expires_at>?""",
                        (token,_at())).fetchone()
    return _public_profile(row["customer_id"]) if row else None


def profile_from_whatsapp_sender(sender: str) -> dict | None:
    # MUST only be called by the verified-signature Meta webhook after allowlist.
    if not PHONE.fullmatch(sender): return None
    with _db() as con:
        row=con.execute("""SELECT customer_id FROM crm_contact_identities
                           WHERE channel='whatsapp' AND normalized_hmac=? AND is_demo=1""",
                        (_fingerprint("phone",sender),)).fetchone()
    return _public_profile(row["customer_id"]) if row else None


def context_for_profile(profile: dict | None) -> str:
    """Only synthetic information for Luna; never phone, PII, or other testers."""
    if not profile: return ""
    items=profile.get("appointments",[])[:3]
    lines=[]
    for item in items:
        if item.get("status")!="demo_only":continue
        lines.append(
            "Demo only: "+item["location"]+" "+item["service"]+" at "+
            item["starts_at"]+" (not a real appointment)"
        )
    return ("\n\nPILOT CRM VERIFIED TESTER CONTEXT. The current channel is securely linked to "+
            profile["name"]+". You may greet this tester by their first name. "+
            "These are intentionally fictional sample appointments; never assert they are "+
            "genuine SGiMED bookings, reservations, payments or medical events. "+
            "Never reveal any other customer's record or contact information. "+
            "Only discuss the tester's fictional appointments if relevant. "+
            ("\n" + "\n".join(lines) if lines else ""))


def install(app, protect):
    initialize()

    @app.post("/api/crm/admin", dependencies=[Depends(protect)])
    async def crm_admin(request: Request):
        main=_app()
        main.authed(request,"admin")
        body=await request.json()
        if not isinstance(body,dict):raise HTTPException(422,detail="Invalid request.")
        action=body.get("action")
        if action=="state":
            profiles=[]
            for code in ("nigel","andre"):
                customer_id="demo-"+code
                profile=_public_profile(customer_id)
                if not profile: continue
                with _db() as con:
                    row=con.execute("SELECT encrypted_value FROM crm_contact_identities WHERE customer_id=?",
                                    (customer_id,)).fetchone()
                phone=_decrypt(row["encrypted_value"]) if row else ""
                profile["phone_masked"]=("•••• "+phone[-4:] if phone else "Not linked")
                profiles.append(profile)
            return JSONResponse({"ok":True,"demo":True,"customers":profiles,
                                 "appointment_count":sum(len(x["appointments"]) for x in profiles),
                                 "notice":"Fictional CRM records only; no SGiMED patient IDs or booking IDs."},
                                headers={"Cache-Control":"no-store, private"})
        if action=="invite":
            code=str(body.get("customer",""))
            if code not in TEST_IDS:raise HTTPException(422,detail="Unknown demo tester.")
            customer_id="demo-"+code
            if not _customer_row(customer_id):
                raise HTTPException(404,detail="Demo tester has not been seeded.")
            allowed,_=main.count_and_limit("crm-invite:"+main.ip_key(request),
                                           MAX_ISSUED_INVITES_HOUR,3600)
            if not allowed:raise HTTPException(429,detail="Too many identity invitations.")
            token=secrets.token_urlsafe(32)
            now=datetime.now(timezone.utc)
            expiry=(now+timedelta(seconds=INVITE_TTL_SECONDS)).isoformat()
            with _db() as con:
                con.execute("BEGIN IMMEDIATE")
                con.execute("DELETE FROM crm_web_invitations WHERE expires_at<?",
                            ((now-timedelta(days=1)).isoformat(),))
                con.execute("INSERT INTO crm_web_invitations VALUES(?,?,?,?,NULL)",
                            (_fingerprint("invite",token),customer_id,now.isoformat(),expiry))
                con.execute("COMMIT")
            main.audit("admin","crm_test_link_created",code)
            return JSONResponse({"ok":True,"invite_url":"https://phoenix.bytesizeprotip.com/access?next=/chat#claim="+token,
                                 "expires_at":expiry,"single_use":True,
                                 "notice":"Anyone with this single-use link and the pilot password can claim that demo identity. Share privately."},
                                headers={"Cache-Control":"no-store, private"})
        if action=="revoke":
            code=str(body.get("customer",""))
            if code not in TEST_IDS:raise HTTPException(422,detail="Unknown demo tester.")
            customer_id="demo-"+code
            with _db() as con:
                con.execute("DELETE FROM crm_web_bindings WHERE customer_id=?",(customer_id,))
                con.execute("DELETE FROM crm_web_invitations WHERE customer_id=?",(customer_id,))
            main.audit("admin","crm_test_links_revoked",code)
            return {"ok":True,"revoked":code}
        raise HTTPException(400,detail="Unknown CRM admin action.")

    @app.post("/api/crm/visitor", dependencies=[Depends(protect)])
    async def crm_visitor(request: Request):
        body=await request.json()
        if not isinstance(body,dict):raise HTTPException(422,detail="Invalid request.")
        action=body.get("action")
        if action=="state":
            profile=profile_from_web(request)
            return JSONResponse({"ok":True,"linked":bool(profile),"profile":profile},
                                headers={"Cache-Control":"no-store, private"})
        if action=="unlink":
            with _db() as con:
                con.execute("DELETE FROM crm_web_bindings WHERE pilot_session_hash=?",
                            (_session_hash(request),))
            return {"ok":True,"linked":False}
        if action=="claim":
            raw=body.get("token","")
            if not isinstance(raw,str) or not INVITE.fullmatch(raw):
                raise HTTPException(422,detail="Invalid tester invitation.")
            main=_app()
            allowed,_=main.count_and_limit("crm-claim:"+main.ip_key(request),10,900)
            if not allowed:raise HTTPException(429,detail="Too many identity link attempts.")
            now=_at()
            digest=_fingerprint("invite",raw)
            session=_session_hash(request)
            with _db() as con:
                con.execute("BEGIN IMMEDIATE")
                invitation=con.execute("""SELECT customer_id FROM crm_web_invitations
                                          WHERE token_hash=? AND used_at IS NULL AND expires_at>?""",
                                       (digest,now)).fetchone()
                if not invitation:
                    con.execute("ROLLBACK")
                    raise HTTPException(403,detail="Link expired or already used.")
                con.execute("UPDATE crm_web_invitations SET used_at=? WHERE token_hash=?",
                            (now,digest))
                until=(datetime.now(timezone.utc)+timedelta(hours=12)).isoformat()
                con.execute("""INSERT INTO crm_web_bindings VALUES(?,?,?,?)
                               ON CONFLICT(pilot_session_hash) DO UPDATE SET
                               customer_id=excluded.customer_id,
                               linked_at=excluded.linked_at,
                               expires_at=excluded.expires_at""",
                            (session,invitation["customer_id"],now,until))
                con.execute("COMMIT")
            main.audit("tester","crm_web_test_identity_linked","demo")
            return JSONResponse({"ok":True,"linked":True,
                                 "profile":_public_profile(invitation["customer_id"])},
                                headers={"Cache-Control":"no-store, private"})
        raise HTTPException(400,detail="Unknown CRM visitor action.")
