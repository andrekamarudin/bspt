"""Synthetic CRM and cross-channel identity tests. No real vendor writes."""
import json
import unittest
import uuid
from unittest.mock import patch

from test_security import sandbox
from fastapi.testclient import TestClient
from app import APP
from crm import (_db, initialize, seed_test_person,
                 profile_from_whatsapp_sender, profile_from_web,
                 context_for_profile)


class CRMTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        initialize()
        seed_test_person("andre", "Andre", "6591111111", "tester")
        seed_test_person("nigel", "Nigel", "6592222222", "clinic_owner")

    def client(self):
        return TestClient(APP,base_url="https://testserver",
                          headers={"origin":"https://testserver",
                                   "x-requested-with":"XMLHttpRequest"})

    def login(self,client,as_admin=False):
        with patch("app.count_and_limit", return_value=(True,0)):
            self.assertEqual(client.post("/api/access",json={"password":"F"*40}).status_code,200)
            if as_admin:
                self.assertEqual(client.post("/api/auth",json={
                    "role":"admin","action":"login","password":"A"*40
                }).status_code,200)
        return client

    def test_schema_and_synthetic_rows_only(self):
        with _db() as con:
            tables={row["name"] for row in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            expected={"crm_customers","crm_contact_identities","crm_appointments",
                      "crm_contact_consents","crm_web_invitations","crm_web_bindings",
                      "crm_provider_mappings","crm_events","crm_schema_version"}
            self.assertTrue(expected <= tables)
            customers=con.execute("SELECT id,is_demo,sgimed_patient_id FROM crm_customers").fetchall()
            self.assertEqual(len(customers),2)
            self.assertTrue(all(row["is_demo"]==1 and row["sgimed_patient_id"] is None for row in customers))
            appts=con.execute("SELECT is_demo,status,sgimed_appointment_id,payment_status FROM crm_appointments").fetchall()
            self.assertEqual(len(appts),4)
            self.assertTrue(all(x["is_demo"]==1 and x["status"]=="demo_only" and
                                x["sgimed_appointment_id"] is None and x["payment_status"]=="not_charged" for x in appts))
            stored=con.execute("SELECT encrypted_value,normalized_hmac FROM crm_contact_identities").fetchall()
            self.assertFalse(any(b"6591111111" in x["encrypted_value"] for x in stored))
            self.assertFalse(any("6591111111" in x["normalized_hmac"] for x in stored))
            with self.assertRaises(Exception):
                con.execute("""INSERT INTO crm_appointments
                    (id,customer_id,location,service,practitioner,starts_at,ends_at,status,source,sgimed_appointment_id,payment_status,is_demo,created_at)
                    VALUES ('bad','demo-andre','Orchard','test','test','x','y','confirmed','synthetic_seed',NULL,'not_charged',1,'x')""")

    def test_whatsapp_sender_is_exact_and_untrusted_numbers_cannot_assume_identity(self):
        andre=profile_from_whatsapp_sender("6591111111")
        nigel=profile_from_whatsapp_sender("6592222222")
        self.assertEqual(andre["name"],"Andre")
        self.assertEqual(nigel["name"],"Nigel")
        self.assertGreaterEqual(len(andre["appointments"]),2)
        self.assertEqual(len([x for x in andre["appointments"] if x["id"].startswith("sim-and")]),2)
        self.assertTrue(all(x["id"].startswith("sim-nig") for x in nigel["appointments"]))
        self.assertIsNone(profile_from_whatsapp_sender("6593333333"))
        self.assertIsNone(profile_from_whatsapp_sender("+6591111111"))
        policy=context_for_profile(andre)
        self.assertIn("Andre",policy)
        self.assertNotIn("Nigel",policy)
        self.assertNotIn("6591111111",policy)
        self.assertIn("not a real appointment",policy)

    def test_admin_only_can_see_masked_customers_and_issue_single_use_claim(self):
        with self.login(self.client()) as c:
            self.assertEqual(c.post("/api/crm/admin",json={"action":"state"}).status_code,401)
            self.assertEqual(c.post("/api/crm/admin",json={"action":"invite","customer":"andre"}).status_code,401)
        with self.login(self.client(),as_admin=True) as c:
            result=c.post("/api/crm/admin",json={"action":"state"})
            self.assertEqual(result.status_code,200,result.text[:170])
            state=result.json()
            self.assertTrue(state["demo"])
            self.assertGreaterEqual(state["appointment_count"],4)
            self.assertEqual({x["name"] for x in state["customers"]},{"Andre","Nigel"})
            self.assertNotIn("6591111111",result.text)
            self.assertNotIn("6592222222",result.text)
            issued=c.post("/api/crm/admin",json={"action":"invite","customer":"andre"})
            self.assertEqual(issued.status_code,200,issued.text[:130])
            self.assertIn("/access?next=/chat#claim=",issued.json()["invite_url"])
            invite=issued.json()["invite_url"].split("#claim=")[1]
            self.assertEqual(len(invite)>=30,True)
        with self.login(self.client()) as target:
            self.assertIsNone(profile_from_web(target))
            first=target.post("/api/crm/visitor",json={"action":"claim","token":invite})
            self.assertEqual(first.status_code,200,first.text[:170])
            self.assertEqual(first.json()["profile"]["name"],"Andre")
            self.assertEqual(profile_from_web(target)["name"],"Andre")
            repeat=target.post("/api/crm/visitor",json={"action":"claim","token":invite})
            self.assertEqual(repeat.status_code,403)
            status=target.post("/api/crm/visitor",json={"action":"state"})
            self.assertEqual(status.json()["profile"]["name"],"Andre")
            goodbye=target.post("/api/crm/visitor",json={"action":"unlink"})
            self.assertEqual(goodbye.status_code,200)
            self.assertIsNone(profile_from_web(target))

    def test_no_unauthorized_customer_claim_by_plain_name_or_phone(self):
        with self.login(self.client()) as c:
            for payload in (
                {"action":"claim","token":"Andre"},
                {"action":"claim","phone":"6591111111"},
                {"action":"claim","name":"Nigel"},
                {"action":"claim","token":"a"*43},
            ):
                r=c.post("/api/crm/visitor",json=payload)
                self.assertIn(r.status_code,(403,422))

    def test_revoking_web_links_invalidates_existing_claims(self):
        with self.login(self.client(),as_admin=True) as admin:
            issued=admin.post("/api/crm/admin",json={"action":"invite","customer":"nigel"})
            self.assertEqual(issued.status_code,200,issued.text[:130])
            invite=issued.json()["invite_url"].split("#claim=")[1]
            with self.login(self.client()) as tester:
                success=tester.post("/api/crm/visitor",json={"action":"claim","token":invite})
                self.assertEqual(success.status_code,200,success.text[:130])
                self.assertEqual(tester.post("/api/crm/visitor",json={"action":"state"}).json()["profile"]["name"],"Nigel")
                revoked=admin.post("/api/crm/admin",json={"action":"revoke","customer":"nigel"})
                self.assertEqual(revoked.status_code,200)
                self.assertFalse(tester.post("/api/crm/visitor",json={"action":"state"}).json()["linked"])

    def test_chat_prompt_uses_only_web_linked_customer(self):
        with self.login(self.client(),as_admin=True) as admin:
            issued=admin.post("/api/crm/admin",json={"action":"invite","customer":"andre"})
            invite=issued.json()["invite_url"].split("#claim=")[1]
            with self.login(self.client()) as c:
                self.assertEqual(c.post("/api/crm/visitor",json={"action":"claim","token":invite}).status_code,200)
                requests=[]
                async def stub(messages,tokens=500):
                    requests.append(messages)
                    if "Output only ANSWER, ASK or OUT_OF_SCOPE" in messages[0]["content"]:
                        return "ANSWER",{}
                    return "This is a demo.",{}
                with patch("app.luna_call",side_effect=stub):
                    response=c.post("/api/chat",json={"sessionId":str(uuid.uuid4()),"message":"Who am I in the pilot?"})
                self.assertEqual(response.status_code,200,response.text[:150])
                self.assertTrue(any("PILOT CRM VERIFIED TESTER CONTEXT" in m[0]["content"] for m in requests))
                body=json.dumps(requests)
                self.assertIn("Andre",body)
                self.assertNotIn("6591111111",body)
                self.assertNotIn("Nigel",body)
