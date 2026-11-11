"""Native function-call loop and zero-write mock adapter contract tests."""
import json
import unittest
import uuid
from unittest.mock import patch

from test_security import sandbox
from crm import seed_test_person, profile_from_whatsapp_sender, _db
from booking_tools import (TOOLS, run_tool, respond, wants_booking_tools,
                           customer_notice, initialize)
from test_booking import synthetic_openings, SLOT, DAY


class BookingToolTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        seed_test_person("andre","Andre","6591111111","tester")
        seed_test_person("nigel","Nigel","6592222222","clinic_owner")
        initialize()
        self.profile=profile_from_whatsapp_sender("6591111111")
        self.chat_id=str(uuid.uuid4())

    async def test_native_contract_real_slots_then_prepared_then_explicit_confirm(self):
        with patch("booking_tools.get_availability",side_effect=synthetic_openings):
            slots,mutated=await run_tool("search_appointments",{"date":DAY,"branch":"Orchard"},
                    profile=None,channel="web",conversation=self.chat_id,user_message="Show times")
            self.assertFalse(mutated)
            self.assertEqual(slots["openings"][0]["service"],SLOT["service"])
            draft,created=await run_tool(
                "prepare_appointment",
                {"date":DAY,"branch":"Orchard","service":SLOT["service"],"start":SLOT["start"]},
                profile=self.profile,channel="web",conversation=self.chat_id,
                user_message="Please book")
            self.assertFalse(created)
            self.assertEqual(draft["status"],"pending_confirmation")
            self.assertNotIn("reference",draft["appointment"])
            premature,confirmed=await run_tool(
                "confirm_appointment",{},profile=self.profile,
                channel="web",conversation=self.chat_id,user_message="I haven't decided")
            self.assertFalse(confirmed)
            self.assertEqual(premature["status"],"awaiting_confirmation")
            yes,confirmed=await run_tool(
                "confirm_appointment",{},profile=self.profile,
                channel="web",conversation=self.chat_id,user_message="confirm")
            self.assertTrue(confirmed)
            self.assertEqual(yes["status"],"confirmed")
            self.assertTrue(yes["reference"].startswith("SIM-"))
            again,confirmed=await run_tool(
                "confirm_appointment",{},profile=self.profile,
                channel="web",conversation=self.chat_id,user_message="confirm")
            self.assertEqual(again["reference"],yes["reference"])
            self.assertTrue(confirmed)
        with _db() as con:
            row=con.execute(
                "SELECT is_demo,sgimed_booking_id,status FROM crm_bot_bookings WHERE reference=?",
                (yes["reference"],)).fetchone()
            self.assertEqual(row["status"],"confirmed_simulation")
            self.assertTrue(row["is_demo"])
            self.assertIsNone(row["sgimed_booking_id"])

    async def test_cannot_claim_another_customers_draft(self):
        other=profile_from_whatsapp_sender("6592222222")
        with patch("booking_tools.get_availability",side_effect=synthetic_openings):
            result,_=await run_tool(
                "prepare_appointment",
                {"date":DAY,"branch":"Orchard","service":SLOT["service"],"start":SLOT["start"]},
                profile=self.profile,channel="whatsapp",conversation=self.chat_id,
                user_message="book this")
            self.assertEqual(result["status"],"pending_confirmation")
            bad,yes=await run_tool("confirm_appointment",{},profile=other,channel="whatsapp",
                                   conversation=self.chat_id,user_message="confirm")
            self.assertFalse(yes)
            self.assertEqual(bad["status"],"not_found")

    async def test_unknown_identity_cannot_prepare_or_confirm(self):
        with patch("booking_tools.get_availability",side_effect=synthetic_openings):
            result,_=await run_tool(
                "prepare_appointment",
                {"date":DAY,"branch":"Orchard","service":SLOT["service"],"start":SLOT["start"]},
                profile=None,channel="web",conversation=self.chat_id,user_message="book")
            self.assertIn("link",result["error"].lower())
            confirm,_=await run_tool("confirm_appointment",{},profile=None,channel="web",
                                     conversation=self.chat_id,user_message="confirm")
            self.assertIn("link",confirm["error"].lower())

    async def test_forged_slot_and_suspicious_args_are_rejected(self):
        with patch("booking_tools.get_availability",side_effect=synthetic_openings):
            bad,_=await run_tool(
                "prepare_appointment",
                {"date":DAY,"branch":"Orchard","service":SLOT["service"],
                 "start":DAY+" 01:00"},
                profile=self.profile,channel="web",conversation=self.chat_id,user_message="book")
            self.assertIn("not currently offered",bad["error"])
            extra,_=await run_tool(
                "prepare_appointment",
                {"date":DAY,"branch":"Orchard","service":SLOT["service"],"start":SLOT["start"],
                 "phone":"6591111111"},
                profile=self.profile,channel="web",conversation=self.chat_id,user_message="book")
            self.assertIn("Unexpected",extra["error"])

    async def test_actual_openai_tool_calls_are_executed_by_mock_provider(self):
        calls=[]
        async def fake_completion(messages,tokens,tools):
            calls.append(messages)
            self.assertEqual(tools[0]["function"]["name"],"search_appointments")
            if len(calls)==1:
                return {"message":{"role":"assistant","content":None,"tool_calls":[{
                    "id":"call_one","type":"function","function":{
                        "name":"search_appointments","arguments":json.dumps({"date":DAY,"branch":"Orchard"})
                    }}]},"usage":{"prompt_tokens":12,"completion_tokens":9}}
            self.assertEqual(messages[-1]["role"],"tool")
            self.assertIn(SLOT["service"],messages[-1]["content"])
            return {"message":{"role":"assistant","content":"An opening is available."},
                    "usage":{"prompt_tokens":13,"completion_tokens":12}}
        with patch("booking_tools.get_availability",side_effect=synthetic_openings):
            reply,usage,used,confirmed=await respond(
                [{"role":"system","content":"Clinic booking assistant"},
                 {"role":"user","content":"Find Orchard appointments"}],300,
                profile=self.profile,channel="web",conversation=self.chat_id,
                user_message="Find Orchard appointments",completion=fake_completion)
        self.assertTrue(used)
        self.assertFalse(confirmed)
        self.assertIn("opening is available",reply)
        self.assertEqual(len(calls),2)
        self.assertEqual(usage["prompt_tokens"],25)
        self.assertIn("simulated",customer_notice(tool_used=used,confirmed=confirmed))

    async def test_web_chat_uses_native_tool_path_for_booking_intent(self):
        from fastapi.testclient import TestClient
        from unittest.mock import AsyncMock
        from app import APP
        with TestClient(APP,base_url="https://testserver",
                        headers={"origin":"https://testserver",
                                 "x-requested-with":"XMLHttpRequest"}) as client:
            with patch("app.count_and_limit",return_value=(True,0)):
                self.assertEqual(client.post("/api/access",json={"password":"F"*40}).status_code,200)
            calls=[]
            async def faux(messages,tokens,**kwargs):
                calls.append({"tool_context":kwargs,"messages":messages})
                return "The 2 PM time is available.",{},True,False
            with patch("app.luna_decide",new_callable=AsyncMock,return_value=("answer",{})), \
                 patch("booking_tools.respond",side_effect=faux), \
                 patch("app.get_availability",side_effect=synthetic_openings):
                result=client.post("/api/chat",json={"message":"Book a physiotherapy appointment tomorrow",
                                                   "sessionId":str(uuid.uuid4())})
            self.assertEqual(result.status_code,200,result.text[:160])
            self.assertEqual(result.json()["status"],"answered")
            self.assertEqual(len(calls),1)
            self.assertEqual(calls[0]["tool_context"]["channel"],"web")
            self.assertIn("simulated checkout",result.json()["reply"])
            self.assertNotIn("Try booking journey",json.dumps(result.json()["links"]))

    def test_booking_mode_carries_over_short_confirmations(self):
        history=[{"role":"user","text":"Please book an appointment at Orchard"}]
        self.assertTrue(wants_booking_tools("confirm",history))
        self.assertTrue(wants_booking_tools("yes",history))
        self.assertTrue(wants_booking_tools("appointments?",[]))
        self.assertFalse(wants_booking_tools("What is the consultation fee?",[]))
        self.assertIn("No real SGiMED booking",customer_notice(tool_used=True,confirmed=True))
        self.assertEqual({t["function"]["name"] for t in TOOLS},{
            "search_appointments","prepare_appointment","confirm_appointment","check_appointment"})
