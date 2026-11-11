"""Only synthetic credentials, test numbers and messages."""
import os,sys,hashlib,hmac,json,unittest
from pathlib import Path
from unittest.mock import patch
# Ensure all sensitive environment is synthetic even without test_security import ordering.
from test_security import sandbox
from fastapi.testclient import TestClient
from app import APP,public_context,build_policy

class OwnerAndWhatsapp(unittest.TestCase):
    def session(self):
        c=TestClient(APP,base_url="https://testserver",
            headers={"origin":"https://testserver","x-requested-with":"XMLHttpRequest"})
        with patch("app.count_and_limit",return_value=(True,0)):
            self.assertEqual(c.post("/api/access",json={"password":"F"*40}).status_code,200)
        self.assertEqual(c.post("/api/auth",json={"action":"login","role":"admin","password":"A"*40}).status_code,200)
        return c
    def test_drafts_published_knowledge_shared_between_channels(self):
        with self.session() as c:
            data={"action":"save","question":"How long is a synthetic standard appointment?",
                  "answer":"The synthetic standard appointment is 45 minutes.","kind":"faq"}
            created=c.post("/api/knowledge",json=data)
            self.assertEqual(created.status_code,200,created.text[:120])
            id=created.json()["id"]
            self.assertNotIn("synthetic standard appointment",str(public_context()["owner_items"]))
            r=c.post("/api/knowledge",json={"action":"publish","id":id,"attest":True})
            self.assertEqual(r.status_code,200,r.text)
            self.assertIn("synthetic standard appointment",build_policy(public_context()))
            self.assertIn("synthetic standard appointment",str(public_context()["owner_items"]))
            data["id"]=id
            data["answer"]="The new draft is 55 minutes."
            self.assertEqual(c.post("/api/knowledge",json=data).status_code,200)
            self.assertNotIn("The new draft is 55 minutes.",str(public_context()["owner_items"]))
            self.assertIn("45 minutes",str(public_context()["owner_items"]))
            self.assertEqual(c.post("/api/knowledge",json={"action":"archive","id":id}).status_code,200)
            self.assertNotIn("synthetic standard appointment",str(public_context()["owner_items"]))
    def test_patient_details_rejected_and_publish_requires_approval(self):
        with self.session() as c:
            r=c.post("/api/knowledge",json={"action":"save",
                "question":"Patient number 99881234, what is my treatment?",
                "answer":"A sample answer that must never be published."})
            self.assertEqual(r.status_code,422)
            r=c.post("/api/knowledge",json={"action":"save",
                "question":"How do I reach synthetic reception?",
                "answer":"Contact the published reception phone line."})
            self.assertEqual(r.status_code,200)
            self.assertEqual(c.post("/api/knowledge",json={"action":"publish","id":r.json()["id"]}).status_code,422)
    def test_developer_controls_verify_token_without_exposing_to_testers(self):
        from app import set_setting
        with self.session() as c:
            # A clinic admin is not entitled to developer Webhook credentials.
            self.assertEqual(c.post("/api/dev",json={"action":"wa_webhook_info"}).status_code,401)
            with patch("app.authed",return_value=None):
                generated=c.post("/api/dev",json={"action":"wa_generate_verify"})
                self.assertEqual(generated.status_code,200)
                self.assertEqual(generated.headers.get("cache-control"),"no-store, private")
                token=generated.json()["verify_token"]
                self.assertGreaterEqual(len(token),30)
                info=c.post("/api/dev",json={"action":"wa_webhook_info"})
                self.assertEqual(info.json()["verify_token"],token)
                self.assertFalse(info.json()["outbound_enabled"])
            # Meta GET handshake must work without browser cookies.
            r=TestClient(APP,base_url="https://testserver").get("/api/whatsapp",params={
                "hub.mode":"subscribe","hub.verify_token":token,"hub.challenge":"1234567"})
            self.assertEqual(r.status_code,200,r.text)
            self.assertEqual(r.text,"1234567")
            self.assertEqual(TestClient(APP,base_url="https://testserver").get("/api/whatsapp",params={
                "hub.mode":"subscribe","hub.verify_token":"wrong","hub.challenge":"1234567"}).status_code,403)
            set_setting("wa_meta_verify_encrypted",None)

    def test_webhook_requires_signature_and_does_not_need_tester_cookie(self):
        with TestClient(APP,base_url="https://testserver") as c:
            r=c.get("/api/whatsapp")
            self.assertEqual(r.status_code,503)
            with patch.dict(os.environ,{"PHOENIX_WA_VERIFY_TOKEN":"synthetic-token",
                                        "PHOENIX_WA_META_APP_SECRET":"synthetic-meta-secret",
                                        "PHOENIX_WA_SEND_ENABLED":"false"}):
                self.assertEqual(c.get("/api/whatsapp",params={"hub.mode":"subscribe",
                    "hub.verify_token":"synthetic-token","hub.challenge":"998"}).text,"998")
                payload={"object":"whatsapp_business_account","entry":[]}
                raw=json.dumps(payload).encode()
                self.assertEqual(c.post("/api/whatsapp",content=raw,
                   headers={"content-type":"application/json","x-hub-signature-256":"sha256="+"0"*64}).status_code,403)
                good="sha256="+hmac.new(b"synthetic-meta-secret",raw,hashlib.sha256).hexdigest()
                self.assertEqual(c.post("/api/whatsapp",content=raw,headers={
                    "content-type":"application/json","x-hub-signature-256":good}).status_code,200)
