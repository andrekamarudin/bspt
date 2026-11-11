"""Native LLM function calling backed by an isolated, hard-wired mock booking adapter.

Tool contract is provider-neutral; the active provider cannot write to SGiMED.
The assistant need not know which provider implements the tool. Users still receive
unambiguous SIM-only receipts and external booking is never claimed.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from typing import Any

import httpx
from availability import BRANCHES, get_availability, validate_date
from crm import _db, _fingerprint

TOOLS = [
    {"type":"function","function":{
        "name":"search_appointments",
        "description":"Find actual currently offered Phoenix Rehab appointment times. Search first before selecting a time.",
        "parameters":{"type":"object","additionalProperties":False,
            "properties":{
                "date":{"type":"string","description":"Optional Singapore local YYYY-MM-DD. For next available, omit date and set next_available true."},
                "next_available":{"type":"boolean","description":"Search the next seven dates from the provided date or today, stopping at the first date with a matching opening."},
                "duration_minutes":{"type":"integer","description":"Exact required appointment length in minutes, e.g. 60 for a one-hour appointment."},
                "branch":{"type":"string","enum":list(BRANCHES),"description":"Optional clinic branch."},
                "service":{"type":"string","description":"Optional service name."}},
            "required":[]}}},
    {"type":"function","function":{
        "name":"prepare_appointment",
        "description":"Start an appointment for the currently authenticated contact at an exact available slot. This requests their explicit confirmation before finalizing.",
        "parameters":{"type":"object","additionalProperties":False,
            "properties":{
                "date":{"type":"string","description":"YYYY-MM-DD Singapore calendar date."},
                "branch":{"type":"string","enum":list(BRANCHES)},
                "service":{"type":"string","description":"Exact service label returned by search_appointments."},
                "start":{"type":"string","description":"Exact start local timestamp from search_appointments."},
                "duration_minutes":{"type":"integer","description":"Exact requested length in minutes. Never silently substitute a shorter appointment."}},
            "required":["date","branch","service","start"]}}},
    {"type":"function","function":{
        "name":"confirm_appointment",
        "description":"Finalize the prepared appointment only after the patient explicitly replies 'confirm' or equivalent. No parameters.",
        "parameters":{"type":"object","additionalProperties":False,"properties":{}}}},
    {"type":"function","function":{
        "name":"check_appointment",
        "description":"Check the status of the latest appointment in this conversation. Never claim a booking without this tool or confirm_appointment.",
        "parameters":{"type":"object","additionalProperties":False,"properties":{}}}}
]

def wants_booking_tools(message: str, history: list[dict]) -> bool:
    """Enable native booking functions when booking is a plausible context."""
    combined=(message+" "+" ".join(str(t.get("text",""))[:250] for t in history[-4:])).lower()
    return bool(re.search(
        r"\b(book|booking|booked|appointments?|reserve|reservation|schedule|scheduled|"
        r"slot|available|availability|physiotherapist|physio|clinic visit|"
        r"consultation time|confirm|confirmation)\b",combined
    ))


BOOKING_GUIDANCE = (
    "\nYou have tools for searching, preparing, confirming and checking appointment bookings. "
    "Use them whenever the person asks about booking; don't just redirect them to another booking page. "
    "If someone asks for 'next available', search starting today across branches and dates; do not ask for a date or branch unnecessarily. "
    "If the person specifies one hour, search and prepare only 60-minute appointments. Never offer a 45-minute appointment as equivalent. "
    "If someone says tomorrow, calculate the Singapore local date. "
    "Search for real openings before preparing. Always ask the person to explicitly confirm the selected "
    "branch, service and exact time; confirm_appointment is only for an explicit confirmation reply. "
    "A contact must be securely linked to the clinic account to place an appointment. "
    "Trust actual tool results, never invent booking status, slots or confirmation numbers."
)
def requested_duration_minutes(messages: list[dict]) -> int | None:
    """Extract explicit duration requirements independently of model tool args."""
    # Last 8 messages include the current turn and its booking-related context.
    texts=[str(m.get("content","")) for m in messages[-8:] if m.get("role")=="user"]
    for message in reversed(texts):
        if re.search(r"(?i)\b(?:1\s*(?:h|hr|hrs|hour)|one[- ]hour|60\s*(?:min|mins|minutes))\b",message):
            return 60
        if re.search(r"(?i)\b(?:45\s*(?:min|mins|minutes)|three[- ]quarters of an hour)\b",message):
            return 45
    return None


ACK = re.compile(r"(?i)^\s*(?:yes|yes please|confirm|confirm booking|confirm appointment|book it|please book it|go ahead|proceed|ok|okay|sounds good|do it|yes confirm)\s*[.!]?\s*$")


def initialize():
    with _db() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS crm_bot_bookings(
            id TEXT PRIMARY KEY,
            customer_id TEXT NOT NULL REFERENCES crm_customers(id),
            conversation_hmac TEXT NOT NULL,
            branch TEXT NOT NULL,
            service TEXT NOT NULL,
            starts_at TEXT NOT NULL,
            ends_at TEXT NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('pending_confirmation','confirmed_simulation','expired')),
            reference TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            confirmed_at TEXT,
            is_demo INTEGER NOT NULL CHECK(is_demo=1),
            sgimed_booking_id TEXT
        );
        CREATE INDEX IF NOT EXISTS crm_bot_bookings_context
            ON crm_bot_bookings(customer_id,conversation_hmac,created_at);
        """)


def _conversation_key(customer_id: str, channel: str, conversation: str) -> str:
    return _fingerprint("bot-booking", customer_id+"|"+channel+"|"+conversation)


def _active(customer_id: str, key: str):
    with _db() as con:
        return con.execute(
            "SELECT * FROM crm_bot_bookings WHERE customer_id=? AND conversation_hmac=? "
            "ORDER BY created_at DESC LIMIT 1",(customer_id,key)).fetchone()


def _minimal_result(row) -> dict:
    state="confirmed" if row["status"]=="confirmed_simulation" else row["status"]
    return {"status":state,"reference":row["reference"],
            "branch":row["branch"],"service":row["service"],
            "start":row["starts_at"],"end":row["ends_at"]}


async def run_tool(name: str, args: dict, *, profile: dict | None, channel: str,
                   conversation: str, user_message: str,
                   required_minutes: int | None = None) -> tuple[dict,bool]:
    """Return (model-facing response, mutation_success). No vendor mutations."""
    if name not in {t["function"]["name"] for t in TOOLS}:
        return {"error":"Unknown appointment tool."},False
    if not isinstance(args,dict):
        return {"error":"Invalid appointment parameters."},False
    if name=="search_appointments":
        try:
            from_date=str(args.get("date","")).strip()
            target=validate_date(from_date or datetime.now(ZoneInfo("Asia/Singapore")).date().isoformat())
            branch=args.get("branch","")
            service=str(args.get("service",""))[:100].lower().strip()
            duration=int(args.get("duration_minutes") or 0)
            if required_minutes:
                duration=required_minutes  # User's constraint outranks model-supplied arguments.
            if duration and not 15<=duration<=240:
                return {"error":"Invalid appointment duration."},False
            if branch and branch not in BRANCHES:
                return {"error":"Unknown branch."},False
            search_days=7 if args.get("next_available") is True or not from_date else 1
            openings=[]
            checked=[]
            for offset in range(search_days):
                day=validate_date((datetime.fromisoformat(target).date()+timedelta(days=offset)).isoformat())
                availability=await get_availability(day)
                checked.append(day)
                openings=sorted([{
                    "branch":x["branch"],"service":x["service"],
                    "start":x["start"],"end":x["end"],"minutes":x["minutes"]}
                    for x in availability["openings"] if x["remaining"]>0
                    and (not branch or branch==x["branch"])
                    and (not service or service in x["service"].lower())
                    and (not duration or int(x["minutes"])==duration)
                ],key=lambda x:(x["start"],x["branch"]))[:12]
                if openings:break
            return {"checked_dates":checked,"openings":openings,
                    "required_minutes":duration or None,
                    "message":("These are the earliest matching publicly offered times and are not held."
                               if openings else "No matching openings in the checked period. Do not substitute another duration.")},False
        except Exception:
            return {"error":"Live calendar unavailable. Ask the customer to try another date."},False

    if not profile:
        return {"error":"Please link your own clinic test profile before making or checking a personal appointment. Web visitors require the admin's one-use invitation."},False

    customer_id=profile["id"]
    if customer_id not in ("demo-andre","demo-nigel"):
        return {"error":"This identity is not authorized for pilot booking."},False
    key=_conversation_key(customer_id,channel,conversation)

    if name=="prepare_appointment":
        if set(args) - {"date","branch","service","start","duration_minutes"}:
            return {"error":"Unexpected booking fields."},False
        try:
            date=validate_date(str(args.get("date","")))
            branch=str(args.get("branch",""))
            service=str(args.get("service",""))
            start=str(args.get("start",""))
            if branch not in BRANCHES or not service or len(service)>120 or len(start)>28:
                return {"error":"Select a valid branch, service and time."},False
            available=await get_availability(date)
            slot=next((x for x in available["openings"]
                       if x["branch"]==branch and x["service"]==service
                       and x["start"]==start and x["remaining"]>0),None)
            if not slot:
                return {"error":"That slot is not currently offered. Search again."},False
            duration=required_minutes or int(args.get("duration_minutes") or 0)
            if duration and int(slot["minutes"])!=duration:
                return {"error":"The selected opening is not the requested duration. Search again; never substitute 45 minutes for one hour."},False
            initialize()
            now=datetime.now(timezone.utc)
            existing=_active(customer_id,key)
            if existing and existing["status"]=="pending_confirmation" and (
                existing["branch"],existing["service"],existing["starts_at"]
            )==(branch,service,start) and datetime.fromisoformat(existing["expires_at"])>now:
                return {"status":"pending_confirmation","appointment":_minimal_result(existing),
                        "next":"Ask patient to confirm this exact time."},False
            ident=str(uuid.uuid4())
            reference="SIM-"+hashlib.sha256(ident.encode()).hexdigest()[:10].upper()
            with _db() as con:
                con.execute("""INSERT INTO crm_bot_bookings
                    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,NULL)""",
                    (ident,customer_id,key,branch,service,slot["start"],slot["end"],
                     "pending_confirmation",reference,now.isoformat(),
                     (now+timedelta(minutes=12)).isoformat(),None,1))
            return {"status":"pending_confirmation",
                    "appointment":{"branch":branch,"service":service,
                                   "start":slot["start"],"end":slot["end"]},
                    "next":"Ask patient to confirm this exact time."},False
        except Exception:
            return {"error":"Unable to verify the slot. Search the calendar again."},False

    row=_active(customer_id,key)
    if not row:
        return {"status":"not_found","message":"No appointment prepared in this conversation."},False
    if name=="check_appointment":
        return _minimal_result(row),False
    if name=="confirm_appointment":
        if row["status"]=="confirmed_simulation":
            return {"status":"confirmed","reference":row["reference"],"appointment":_minimal_result(row)},True
        if datetime.fromisoformat(row["expires_at"])<datetime.now(timezone.utc):
            with _db() as con:
                con.execute("UPDATE crm_bot_bookings SET status='expired' WHERE id=? AND status='pending_confirmation'",(row["id"],))
            return {"status":"expired","message":"Please search for a new opening."},False
        # Tool call alone is not consent. Require explicit, unambiguous words
        # from the person in THIS message, not model-supplied arguments.
        if not ACK.fullmatch(user_message or ""):
            return {"status":"awaiting_confirmation",
                    "message":"Ask the person to reply exactly 'confirm' to authorize this booking."},False
        # Recheck live availability immediately before the simulated commit.
        day=row["starts_at"][:10]
        try:
            available=await get_availability(day)
            slot=next((x for x in available["openings"] if
                       x["branch"]==row["branch"] and x["service"]==row["service"] and
                       x["start"]==row["starts_at"] and x["remaining"]>0),None)
        except Exception: slot=None
        if not slot:
            return {"status":"slot_unavailable","message":"This time is no longer verified. Search again."},False
        with _db() as con:
            con.execute("BEGIN IMMEDIATE")
            updated=con.execute("""UPDATE crm_bot_bookings SET status='confirmed_simulation',
                                  confirmed_at=? WHERE id=? AND status='pending_confirmation'""",
                                (datetime.now(timezone.utc).isoformat(),row["id"])).rowcount
            con.execute("COMMIT")
        if not updated:
            return {"status":"already_processed","message":"Please check appointment status."},False
        return {"status":"confirmed","reference":row["reference"],
                "appointment":{"branch":row["branch"],"service":row["service"],
                               "start":row["starts_at"],"end":row["ends_at"]}},True
    return {"error":"Unsupported appointment tool."},False


async def gateway_completion(messages: list[dict], tokens: int, tools: list[dict]) -> dict:
    """Native OpenAI-format tool_calls; tool schema stays the same for future vendor adapters."""
    from app import AI_GATEWAY_ENDPOINT, active_model
    model=active_model()
    payload={"model":model,"messages":messages,
             "max_completion_tokens":max(100,min(1400,tokens)),
             "tools":tools,"tool_choice":"auto"}
    if model.startswith("openai/gpt-6-luna"):
        payload["reasoning_effort"]="minimal"
    async with httpx.AsyncClient(timeout=httpx.Timeout(40.0,connect=8.0),
                                  follow_redirects=False) as client:
        response=await client.post(
            AI_GATEWAY_ENDPOINT,
            headers={"Authorization":"Bearer "+os.environ["AI_GATEWAY_API_KEY"],
                     "Content-Type":"application/json"},json=payload)
    if response.status_code!=200:
        raise RuntimeError("AI tool gateway HTTP "+str(response.status_code))
    try:
        obj=response.json()
        result={"message":obj["choices"][0]["message"],"usage":obj.get("usage",{})}
        # Every tool-enabled model call is billed independently, exactly as
        # ordinary Luna calls in the shared clinic cost ledger.
        from app import record_model_call
        record_model_call(model,obj.get("usage",{}),obj)
        return result
    except (ValueError,TypeError,KeyError,IndexError):
        raise RuntimeError("Bad AI tool response") from None


async def respond(messages: list[dict], tokens: int, *, profile: dict | None,
                  channel: str, conversation: str, user_message: str,
                  completion=gateway_completion) -> tuple[str,dict,bool,bool]:
    """Return (reply,usage,booking_tool_used,confirmed). Only tool replies can mutate."""
    initialize()
    request=[dict(m) for m in messages]
    request[0]["content"] += BOOKING_GUIDANCE
    tool_used=False
    confirmed=False
    duration_constraint=requested_duration_minutes(messages)
    usage={"prompt_tokens":0,"completion_tokens":0}
    for round_index in range(3):
        result=await completion(request,tokens,TOOLS)
        for key in usage:
            usage[key]+=int((result.get("usage") or {}).get(key,0) or 0)
        msg=result["message"]
        tool_calls=msg.get("tool_calls") or []
        if not tool_calls:
            text=msg.get("content") or ""
            if isinstance(text,list):
                text="\n".join(str(p.get("text","")) for p in text if isinstance(p,dict))
            reply=str(text).strip()[:3400] or "What date and clinic would you prefer?"
            return reply,usage,tool_used,confirmed
        if len(tool_calls)>3 or round_index>=2:
            return "Please tell me which appointment you want to select.",usage,tool_used,confirmed
        clean_calls=[]
        for call in tool_calls:
            f=call.get("function") or {}
            name=str(f.get("name",""))
            call_id=str(call.get("id",""))
            if len(call_id)>120 or not re.fullmatch(r"[A-Za-z0-9_-]{1,120}",call_id):
                return "I couldn't complete that request. Please try again.",usage,tool_used,confirmed
            try:
                args=json.loads(f.get("arguments") or "{}")
            except (ValueError,TypeError):
                args={}
            if not isinstance(args,dict) or len(json.dumps(args))>1800:
                args={}
            clean_calls.append((call_id,name,args))
        # Pass only validated function calls back; never execute arbitrary names.
        request.append({"role":"assistant","content":msg.get("content") or None,
                        "tool_calls":[{"id":ident,"type":"function",
                                       "function":{"name":name,"arguments":json.dumps(args)}}
                                      for ident,name,args in clean_calls]})
        for ident,name,args in clean_calls:
            response,done=await run_tool(name,args,profile=profile,channel=channel,
                                         conversation=conversation,user_message=user_message,
                                         required_minutes=duration_constraint)
            tool_used=True
            confirmed|=done
            request.append({"role":"tool","tool_call_id":ident,
                            "content":json.dumps(response,ensure_ascii=False)})
    return "What date and branch would you like?",usage,tool_used,confirmed


def customer_notice(*,tool_used:bool,confirmed:bool)->str:
    if confirmed:
        return "\n\nPILOT CONFIRMATION ONLY: This is a simulated appointment. No real SGiMED booking was created."
    if tool_used:
        return "\n\nPilot booking tools use simulated checkout. No actual appointment has been reserved."
    return ""
