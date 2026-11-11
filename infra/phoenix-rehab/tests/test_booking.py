"""Booking path: synthetic slots and never a real SGiMED write or patient record."""
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from unittest import TestCase
from unittest.mock import patch
from fastapi.testclient import TestClient

from test_security import sandbox  # synthetic environment and private SQLite
from app import APP, db
from booking import MODE, choose_route, booking_link

DAY = (datetime.now(ZoneInfo("Asia/Singapore")).date() + timedelta(days=1)).isoformat()
SLOT = {
    "branch": "Orchard", "service": "Synthetic Physiotherapy Test",
    "start": DAY + " 14:00", "end": DAY + " 14:45",
    "minutes": 45, "remaining": 1
}

async def synthetic_openings(day):
    return {
        "date": day, "checked_at": datetime.now(ZoneInfo("Asia/Singapore")).isoformat(),
        "checked_branches": ["Orchard"], "unavailable_branches": [],
        "openings": [dict(SLOT)], "transactional": False,
    }


class BookPilotTests(TestCase):
    def client(self):
        return TestClient(
            APP, base_url="https://testserver",
            headers={"origin": "https://testserver", "x-requested-with": "XMLHttpRequest"}
        )

    def login(self, client):
        with patch("app.count_and_limit", return_value=(True, 0)):
            result = client.post("/api/access", json={"password": "F" * 40})
        self.assertEqual(result.status_code, 200)
        return client

    def draft(self, client):
        with patch("booking.get_availability", side_effect=synthetic_openings):
            return client.post("/api/booking", json={
                "action": "draft", "date": DAY,
                "branch": SLOT["branch"], "service": SLOT["service"],
                "start": SLOT["start"], "end": SLOT["end"],
            })

    def test_routes_require_private_pilot_access(self):
        with self.client() as c:
            response=c.get("/book",follow_redirects=False)
            self.assertEqual(response.status_code,303)
            self.assertEqual(response.headers["location"],"/access?next=/book")
            self.assertEqual(c.get("/api/booking/capabilities").status_code,401)
            self.assertEqual(c.post("/api/booking",json={"action":"capabilities"}).status_code,401)

    def test_live_slots_draft_demo_verification_and_simulation(self):
        with self.login(self.client()) as c:
            capabilities=c.get("/api/booking/capabilities")
            self.assertEqual(capabilities.status_code,200)
            self.assertEqual(capabilities.json()["mode"],"simulation")
            self.assertFalse(capabilities.json()["real_booking_enabled"])
            self.assertFalse(capabilities.json()["real_otp_sent"])
            self.assertFalse(capabilities.json()["payment_collected"])
            with patch("booking.get_availability",side_effect=synthetic_openings):
                results=c.get("/api/booking/slots",params={"date":DAY,"branch":"Orchard"})
            self.assertEqual(results.status_code,200)
            self.assertEqual(len(results.json()["openings"]),1)
            created=self.draft(c)
            self.assertEqual(created.status_code,200,created.text[:140])
            ident=created.json()["draft_id"]
            self.assertIn("phoenixrehabgroup.com",created.json()["public_booking_url"])
            before=c.post("/api/booking",json={"action":"complete","id":ident,"accept_test_only":True})
            self.assertEqual(before.status_code,409)
            invalid=c.post("/api/booking",json={"action":"verify","id":ident,"otp":"123456"})
            self.assertEqual(invalid.status_code,422)
            verified=c.post("/api/booking",json={"action":"verify","id":ident,"otp":"000000"})
            self.assertEqual(verified.status_code,200,verified.text[:140])
            self.assertEqual(verified.json()["state"],"verified")
            done=c.post("/api/booking",json={"action":"complete","id":ident,"accept_test_only":True})
            self.assertEqual(done.status_code,200,done.text[:140])
            self.assertEqual(done.json()["status"],"simulated_only")
            self.assertFalse(done.json()["real_booking_created"])
            self.assertIsNone(done.json()["external_booking_id"])
            self.assertTrue(done.json()["simulation_id"].startswith("SIM-"))
            replay=c.post("/api/booking",json={"action":"complete","id":ident,"accept_test_only":True})
            self.assertEqual(done.json()["simulation_id"],replay.json()["simulation_id"])
            with db() as conn:
                row=conn.execute("SELECT state,service FROM booking_drafts WHERE id=?",(ident,)).fetchone()
            self.assertEqual(row["state"],"completed")
            self.assertEqual(row["service"],SLOT["service"])

    def test_rejects_forged_slot_and_patient_details(self):
        with self.login(self.client()) as c:
            with patch("booking.get_availability",side_effect=synthetic_openings):
                forged=c.post("/api/booking",json={
                    "action":"draft","date":DAY,"branch":"Orchard",
                    "service":SLOT["service"],"start":DAY+" 10:00","end":DAY+" 10:45"
                })
            self.assertEqual(forged.status_code,409)
            info=c.post("/api/booking",json={"action":"draft","date":DAY,
                      "patient_name":"Do Not Store","phone":"60000000"})
            self.assertEqual(info.status_code,422)
            self.assertIn("No patient-identifying",info.text)

    def test_one_tester_cannot_claim_anothers_draft(self):
        with self.login(self.client()) as first, self.login(self.client()) as second:
            created=self.draft(first)
            self.assertEqual(created.status_code,200)
            ident=created.json()["draft_id"]
            steal=second.post("/api/booking",json={"action":"verify","id":ident,"otp":"000000"})
            self.assertEqual(steal.status_code,404)
            own=first.post("/api/booking",json={"action":"verify","id":ident,"otp":"000000"})
            self.assertEqual(own.status_code,200)

    def test_expired_draft_rejected(self):
        with self.login(self.client()) as c:
            created=self.draft(c)
            self.assertEqual(created.status_code,200)
            ident=created.json()["draft_id"]
            with db() as conn:
                conn.execute("UPDATE booking_drafts SET expires=? WHERE id=?",
                             ((datetime.now(ZoneInfo("UTC"))-timedelta(minutes=5)).isoformat(),ident))
            expired=c.post("/api/booking",json={"action":"verify","id":ident,"otp":"000000"})
            self.assertEqual(expired.status_code,410)

    def test_provider_router_prevents_duplicate_creation_after_uncertain_outcome(self):
        self.assertEqual(MODE,"simulation")
        self.assertEqual(choose_route(writes_authorized=False,official_healthy=True),"simulation")
        self.assertEqual(choose_route(writes_authorized=True,official_healthy=True),"official_api")
        self.assertEqual(choose_route(writes_authorized=True,official_healthy=False),"sgimed_public_handoff")
        self.assertEqual(choose_route(writes_authorized=True,official_healthy=False,outcome_known=False),"reconcile_first")
        self.assertEqual(booking_link("Orchard"),"https://phoenixrehabgroup.com/calendar/orchard/clinic-page")
