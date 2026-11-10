"""Read-only SGiMED public booking schedule adapter.

IMPORTANT: Vendor responses can include PRIVATE staff fields (date_of_birth, NRIC,
email) and clinic tokens. This module MUST NEVER log, cache, persist or pass
full upstream JSON objects to clients/models. Strictly allowlist public branch,
calendar label, open time blocks and remaining capacity, then drop raw payloads.

Requests use only an official public online-booking link scoped to each branch.
No endpoint in this module performs a POST, PUT, DELETE or makes a reservation.
"""
from __future__ import annotations
import asyncio
from datetime import date,datetime,timedelta
import re
import time
from urllib.parse import parse_qs,urlsplit
from zoneinfo import ZoneInfo
import httpx

SG=ZoneInfo("Asia/Singapore")
SOURCE_ROOT="https://phoenixrehabgroup.com/calendar/"
SCHEDULE_ENDPOINT="https://api.hb.sgimed.com/api/el/online-booking/branch-calendars/schedule"
BRANCHES={
    "Orchard":"orchard",
    "Tampines":"tampines",
    "Serangoon":"serangoon",
    "Tanjong Pagar":"tanjongpagar",
    "Jurong East":"jurong"
}
_CACHE:dict[str,tuple[float,dict]]={}
_LOCK=asyncio.Lock()
TTL_SECONDS=120

def validate_date(raw:str)->str:
    try:
        parsed=date.fromisoformat(raw)
    except ValueError:
        raise ValueError("Please provide a date in YYYY-MM-DD format.") from None
    today=datetime.now(SG).date()
    if parsed<today or parsed>today+timedelta(days=30):
        raise ValueError("Availability can be checked from today to 30 days ahead.")
    return parsed.isoformat()

async def _per_branch(client:httpx.AsyncClient,branch:str,slug:str,target:str)->tuple[list[dict],bool]:
    try:
        public=SOURCE_ROOT+slug+"/clinic-page"
        redirected=await client.get(public,follow_redirects=True)
        redirected.raise_for_status()
        url=urlsplit(str(redirected.url))
        if url.scheme!="https" or url.hostname!="el.hb.sgimed.com":
            return [],False
        token=parse_qs(url.fragment.partition("?")[2]).get("t",[""])[0]
        if not (100<=len(token)<=3000 and re.fullmatch(r"[A-Za-z0-9._~-]+",token)):
            return [],False
        response=await client.get(SCHEDULE_ENDPOINT,params={"date":target},
                                  headers={"Authorization":"Bearer "+token,"Accept":"application/json"},
                                  follow_redirects=False)
        response.raise_for_status()
        obj=response.json()
        if not isinstance(obj,dict) or obj.get("date")!=target:
            return [],False
        # Read only explicitly-approved field names. NEVER expose other keys.
        calendars=obj.get("value")
        if not isinstance(calendars,list):
            return [],False
        results=[]
        now=datetime.now(SG).replace(tzinfo=None)
        for item in calendars[:50]:
            if not isinstance(item,dict):continue
            meta=item.get("online_booking_calendar")
            if not isinstance(meta,dict):continue
            detail=meta.get("detail_json")
            label=str(detail.get("name","") if isinstance(detail,dict) else "").strip()[:90]
            if not label or any(ord(c)<32 for c in label):continue
            blocks=item.get("available_blocks")
            if not isinstance(blocks,list):continue
            for block in blocks[:80]:
                if not isinstance(block,dict):continue
                try:
                    start=datetime.fromisoformat(str(block.get("start_at","")))
                    end=datetime.fromisoformat(str(block.get("end_at","")))
                    remaining=int(block.get("remaining",0))
                    if start.tzinfo or end.tzinfo:continue  # vendor publishes Singapore local time
                    if start.date().isoformat()!=target or start<now or end<=start:continue
                    minutes=int((end-start).total_seconds()/60)
                    if remaining<1 or not 15<=minutes<=180:continue
                    results.append({
                        "branch":branch,
                        "service":label,
                        "start":start.strftime("%Y-%m-%d %H:%M"),
                        "end":end.strftime("%Y-%m-%d %H:%M"),
                        "minutes":minutes,
                        "remaining":min(remaining,99)
                    })
                except (TypeError,ValueError,OverflowError):
                    continue
        return results,True
    except (httpx.HTTPError,ValueError,KeyError,TypeError):
        return [],False

async def get_availability(raw_date:str)->dict:
    target=validate_date(raw_date)
    async with _LOCK:
        cached=_CACHE.get(target)
        if cached and cached[0]>time.monotonic():
            return dict(cached[1])
        limits=httpx.Limits(max_connections=4,max_keepalive_connections=4)
        async with httpx.AsyncClient(timeout=httpx.Timeout(18.0,connect=7.0),
                                     limits=limits,headers={"User-Agent":"BSPT-Phoenix-InternalPilot/1.0"}) as client:
            sem=asyncio.Semaphore(3)
            async def fetch(branch,slug):
                async with sem:return branch,await _per_branch(client,branch,slug,target)
            tasks=await asyncio.gather(*(fetch(name,slug) for name,slug in BRANCHES.items()))
        results=[]
        checked=[]
        failed=[]
        for name,(items,ok) in tasks:
            if ok:
                checked.append(name)
                results.extend(items)
            else:failed.append(name)
        # Never cache raw vendor objects, token strings or staff identifier fields.
        unique={}
        for item in results:
            unique[(item["branch"],item["service"],item["start"],item["end"])]=item
        openings=sorted(unique.values(),key=lambda v:(v["start"],v["branch"],v["service"]))[:160]
        out={
            "date":target,"timezone":"Asia/Singapore",
            "checked_at":datetime.now(SG).isoformat(timespec="seconds"),
            "checked_branches":checked,"unavailable_branches":failed,
            "openings":openings,
            "transactional":False,
            "notice":"Read-only current availability. This pilot does not submit or confirm bookings."
        }
        # Cache for two minutes to respect upstream capacity and avoid unnecessary calls.
        _CACHE[target]=(time.monotonic()+TTL_SECONDS,out)
        return dict(out)
