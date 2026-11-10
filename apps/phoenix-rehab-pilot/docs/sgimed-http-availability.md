# SGiMED appointment availability: HTTP-only reconnaissance (10 Nov 2026)

## Source of evidence
The public official SGiMED booking redirects, HTML and public JavaScript bundles were inspected with ordinary HTTP GET requests on GreenCloud. **No browser session was used and no customer/clinic credentials or appointments were queried.**

- Global Phoenix Rehab booking link: `https://hbp.sgimed.com/l/_5wgE2UA` redirects to the SGiMED online-booking-global-calendar experience.
- Official branch links, for example `https://phoenixrehabgroup.com/calendar/orchard/wa`, redirect to online-booking.
- Both use `https://el.hb.sgimed.com/apibase.js` defining an API base `https://api.hb.sgimed.com/api`.
- The public JavaScript bundle `/s/index-CmP_WXHB.js` contains the following API route identifiers.

## Candidate read-only availability routes

| Public frontend route identifier | Inspected query/parameters | Meaning inferred, **not validated** |
| --- | --- | --- |
| `get@el/online-booking/calendars` | none in public call site | Available booking calendars |
| `get@el/online-booking/branch-calendars/schedule` | `query: {date: YYYY-MM-DD}` | Global/branch-calendar availability |
| `get@el/online-booking/calendar/:id/schedule` | `params: {id: selectedCalendar.id}, query: {date: YYYY-MM-DD}` | Per-calendar availability |
| `get@el/online-booking/calendar/:id/appointment-types` | to verify | Duration and appointment type options |
| `get@el/online-booking/branch-info` | `query: {branch_id}` | Branch information |

One JavaScript function loops over dates and selects the global `branch-calendars/schedule` endpoint when `v.value` is true; otherwise it selects `calendar/:id/schedule`. It branches on response fields `value` (global) and `available_blocks` (single calendar), respectively.

These are **implementation clues only**, not a supported, authorised, or reliably documented third-party API. No evidence yet confirms:
- Authentication, anti-automation or token requirements
- Whether the redirect's booking token is necessary, how it is scoped, or whether it is safe to transmit server side
- Full response schema, times and time zones, appointment type, practitioner matching
- Terms of service, rate limits, permission from Nigel or SGiMED for a production integration

## Go/no-go
Keep user-facing booking handoffs pointed to the official calendars. **Do not issue availability claims or connect live data** until authorised read-only endpoints and their contract are confirmed and tested. Avoid live appointment mutation endpoints; they are unnecessary for this work.

Next step: obtain formal SGiMED API/integration documentation or explicit permission from Phoenix Rehab's authorised account owner, then verify a read-only call under least-privilege credentials with bounded rate limits.

## 11 Nov internal adapter update

The isolated GreenCloud internal pilot now performs **read-only** date-scoped SGiMED calendar calls via public clinic booking links. The backend discards the raw upstream responses (which may contain private staff fields and booking tokens), retains only a strict allowlist of publicly offered opening times, caches the projection for two minutes, and exposes no booking mutation route. Synthetic privacy tests validate that private fields cannot be emitted. One internal check for 12 Nov reached all five branches and returned 14 open blocks, but their continuing availability is not guaranteed.

**This is technical verification, not contractual approval.** Clinic/supplier terms, permitted use, availability semantics and supported API behaviour remain to be confirmed before any customer-facing availability service. No actual appointments are made by this prototype.
