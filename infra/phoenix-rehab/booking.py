"""Phoenix booking journey with a HARD read-only / simulation-only boundary.

Booking is a two-provider workflow:
  1) official SGiMED integration (future, vendor-approved write contract)
  2) public SGiMED booking *handoff* on official API outage.

Current pilot implements only a synthetic confirmation of a real public slot.
Neither this module nor any method it imports sends a booking mutation to SGiMED.
No patient names, phone numbers, emails, or clinical records are accepted/stored.
"""
from __future__ import annotations

import hashlib
import hmac
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Protocol, Literal

from fastapi import Depends, HTTPException, Request
from fastapi.responses import JSONResponse

from availability import BRANCHES, SOURCE_ROOT, get_availability, validate_date

MODE: Literal["simulation"] = "simulation"
DEMO_OTP = "000000"
DRAFT_TTL_MINUTES = 12
MAX_DRAFTS_PER_TESTER = 10


class BookingProvider(Protocol):
    """Production provider contract, not an implemented commercial API."""
    async def create(self, booking_intent: dict, idempotency_key: str) -> dict: ...
    async def verify(self, pending_id: str, proof: dict) -> dict: ...
    async def status(self, provider_reference: str) -> dict: ...


def choose_route(*, writes_authorized: bool, official_healthy: bool, outcome_known: bool=True) -> str:
    """Do not fail over blindly after an ambiguous write; duplicate prevention first."""
    if not writes_authorized:
        return "simulation"
    if not outcome_known:
        return "reconcile_first"
    if official_healthy:
        return "official_api"
    return "sgimed_public_handoff"


def booking_link(branch: str) -> str:
    slug = BRANCHES.get(branch)
    if not slug:
        raise HTTPException(422, detail="Choose a supported clinic branch.")
    return SOURCE_ROOT + slug + "/clinic-page"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _safe(body: object) -> dict:
    if not isinstance(body, dict):
        raise HTTPException(422, detail="Invalid booking request.")
    if set(body) - {"action", "date", "branch", "service", "start", "end", "id", "otp", "accept_test_only"}:
        # Avoid accidental processing or storage of patient data submitted by clients.
        raise HTTPException(422, detail="No patient-identifying details are accepted in pilot checkout.")
    return body


def install(app, protect):
    from app import db, KEY, PILOT_COOKIE, count_and_limit, ip_key, audit
    with db() as con:
        con.execute("""CREATE TABLE IF NOT EXISTS booking_drafts (
            id TEXT PRIMARY KEY,
            tester_hash TEXT NOT NULL,
            branch TEXT NOT NULL, service TEXT NOT NULL,
            start_at TEXT NOT NULL, end_at TEXT NOT NULL,
            state TEXT NOT NULL, created TEXT NOT NULL,
            expires TEXT NOT NULL, completed TEXT
        )""")
        con.execute("CREATE INDEX IF NOT EXISTS booking_drafts_expires ON booking_drafts(expires)")

    def tester_hash(request: Request) -> str:
        # The global private pilot middleware validates this cookie against DB first.
        value = request.cookies.get(PILOT_COOKIE, "")
        if not re.fullmatch(r"[0-9a-f]{64}", value):
            raise HTTPException(401, detail="Pilot session required.")
        return hmac.new(KEY, ("booking:" + value).encode(), hashlib.sha256).hexdigest()

    def row_for(request: Request, ident: object):
        try:
            ident = str(uuid.UUID(str(ident)))
        except (ValueError, TypeError):
            raise HTTPException(422, detail="Invalid booking test ID.")
        with db() as con:
            row = con.execute(
                "SELECT * FROM booking_drafts WHERE id=? AND tester_hash=?",
                (ident, tester_hash(request)),
            ).fetchone()
        if row is None:
            raise HTTPException(404, detail="Booking test not found.")
        if datetime.fromisoformat(row["expires"]) < _now() and row["state"] != "completed":
            raise HTTPException(410, detail="Test session expired. Please select an opening again.")
        return row

    def _capabilities() -> dict:
        return {
            "ok": True,
            "mode": MODE,
            "source": "Live SGiMED public availability",
            "real_booking_enabled": False,
            "real_otp_sent": False,
            "payment_collected": False,
            "official_api_status": "Awaiting vendor authorization and signed contract",
            "fallback": "SGiMED public booking page (customer completes booking)",
            "demo_otp": DEMO_OTP,
            "notice": "All confirmations on this page are simulations. No appointment is created.",
        }

    @app.get("/api/booking/capabilities", dependencies=[Depends(protect)])
    async def capabilities(request: Request):
        return JSONResponse(_capabilities(), headers={"Cache-Control": "no-store"})

    @app.get("/api/booking/slots", dependencies=[Depends(protect)])
    async def slots(request: Request, date: str, branch: str = ""):
        allowed, _ = count_and_limit("booking-slots:" + ip_key(request), 24, 86400)
        if not allowed:
            raise HTTPException(429, detail="Too many calendar checks. Try later.")
        try:
            target = validate_date(date)
        except ValueError as exc:
            raise HTTPException(422, detail=str(exc)) from exc
        if branch and branch not in BRANCHES:
            raise HTTPException(422, detail="Unknown branch.")
        data = await get_availability(target)
        opening = [x for x in data["openings"] if not branch or x["branch"] == branch]
        return JSONResponse({
            "ok": True, "date": target, "checked_at": data["checked_at"],
            "checked_branches": data["checked_branches"],
            "unavailable_branches": data["unavailable_branches"],
            "openings": opening[:100],
            "mode": MODE, "real_booking_enabled": False,
        }, headers={"Cache-Control": "no-store"})

    @app.post("/api/booking", dependencies=[Depends(protect)])
    async def booking(request: Request):
        # Bound request size before parsing, not just after rejecting unknown keys.
        raw = await request.body()
        if len(raw) > 4096:
            raise HTTPException(413, detail="Booking test request is too large.")
        try:
            import json
            body = _safe(json.loads(raw))
        except (ValueError, UnicodeDecodeError):
            raise HTTPException(400, detail="Invalid booking JSON.") from None
        action = str(body.get("action", ""))
        if action == "capabilities":
            return _capabilities()
        if action == "draft":
            allowed, _ = count_and_limit("booking-draft:" + ip_key(request), 20, 86400)
            if not allowed:
                raise HTTPException(429, detail="Booking test limit reached.")
            target = str(body.get("date", ""))
            try:
                target = validate_date(target)
            except ValueError as exc:
                raise HTTPException(422, detail=str(exc)) from exc
            branch = str(body.get("branch", ""))[:80]
            service = str(body.get("service", ""))[:120]
            start = str(body.get("start", ""))[:22]
            end = str(body.get("end", ""))[:22]
            if not branch or not service or not start or not end or branch not in BRANCHES:
                raise HTTPException(422, detail="Choose a complete appointment time.")
            # Recheck the selected slot against SGiMED; no invented or stale inventory.
            data = await get_availability(target)
            match = next((x for x in data["openings"] if
                          x["branch"] == branch and x["service"] == service and
                          x["start"] == start and x["end"] == end and
                          x["remaining"] > 0), None)
            if match is None:
                raise HTTPException(409, detail="That opening is no longer confirmed by SGiMED.")
            ident = str(uuid.uuid4())
            now = _now()
            with db() as con:
                con.execute("DELETE FROM booking_drafts WHERE expires<?", ((now - timedelta(days=1)).isoformat(),))
                con.execute("INSERT INTO booking_drafts VALUES(?,?,?,?,?,?,?,?,?,?)",
                    (ident, tester_hash(request), branch, service, start, end, "draft",
                     now.isoformat(), (now + timedelta(minutes=DRAFT_TTL_MINUTES)).isoformat(), None))
            audit("tester", "booking_simulation_draft", branch[:35])
            return JSONResponse({
                "ok": True, "mode": MODE, "draft_id": ident,
                "expires_at": (now + timedelta(minutes=DRAFT_TTL_MINUTES)).isoformat(),
                "slot": match, "public_booking_url": booking_link(branch),
                "next": "simulate_verification",
                "notice": "This does not hold or reserve the appointment.",
            }, headers={"Cache-Control": "no-store"})
        if action == "verify":
            row = row_for(request, body.get("id"))
            if row["state"] == "completed":
                return {"ok": True, "state": "completed", "mode": MODE}
            if row["state"] == "verified":
                return {"ok": True, "state": "verified", "mode": MODE}
            allowed, _ = count_and_limit("booking-verification:" + ip_key(request), 18, 900)
            if not allowed:
                raise HTTPException(429, detail="Too many simulated verification attempts.")
            if not hmac.compare_digest(str(body.get("otp", "")), DEMO_OTP):
                raise HTTPException(422, detail="Use the demo code shown on the page. No real SMS was sent.")
            with db() as con:
                con.execute("UPDATE booking_drafts SET state='verified' WHERE id=? AND tester_hash=? AND state='draft'",
                            (row["id"], tester_hash(request)))
            return {"ok": True, "state": "verified", "mode": MODE,
                    "notice": "Demo verification passed. No SMS was sent."}
        if action == "complete":
            row = row_for(request, body.get("id"))
            if body.get("accept_test_only") is not True:
                raise HTTPException(422, detail="Confirm this is a simulation with no real appointment.")
            if row["state"] not in ("verified", "completed"):
                raise HTTPException(409, detail="Complete the simulated verification first.")
            if row["state"] == "verified":
                with db() as con:
                    con.execute("UPDATE booking_drafts SET state='completed',completed=? WHERE id=? AND tester_hash=? AND state='verified'",
                                (_now().isoformat(), row["id"], tester_hash(request)))
                audit("tester", "booking_simulation_completed", row["branch"][:35])
            # Stable for retries, but unmistakably NOT an actual booking ID.
            code = "SIM-" + hashlib.sha256(row["id"].encode()).hexdigest()[:10].upper()
            return JSONResponse({
                "ok": True, "status": "simulated_only", "simulation_id": code,
                "real_booking_created": False, "external_booking_id": None,
                "slot": {"branch": row["branch"], "service": row["service"],
                         "start": row["start_at"], "end": row["end_at"]},
                "public_booking_url": booking_link(row["branch"]),
                "notice": "TEST COMPLETE ONLY. No SGiMED appointment was created, held or paid for.",
                "next": "Use the official SGiMED booking page to make a real appointment.",
            }, headers={"Cache-Control": "no-store"})
        if action == "state":
            row = row_for(request, body.get("id"))
            return {"ok": True, "state": row["state"], "mode": MODE,
                    "real_booking_created": False}
        raise HTTPException(400, detail="Unknown booking operation.")
