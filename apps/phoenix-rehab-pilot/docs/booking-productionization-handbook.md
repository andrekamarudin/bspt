# Phoenix Rehab: Booking Productionization Handbook

**Version:** 0.1 · **Started:** 11 November 2026 · **Owner:** ByteSize ProTip · **Client:** Phoenix Rehab
**Source of truth:** `andrekamarudin/bspt`, this document and the GreenCloud service.
**Commercial gate:** **Never activate real booking until Phoenix signs off, agrees to pay, and authorizes live patient use.**

## 1. Current status and decisions

| Capability | State | Evidence / missing requirement |
| --- | --- | --- |
| Private website chat and booking journey on GreenCloud | IMPLEMENTED | `/chat`, `/book`; tester login required |
| Read live SGiMED calendar | IMPLEMENTED | Public branch calendar, 5 branches, 2-minute cache, only projected public fields |
| Select a real open slot | IMPLEMENTED | Server rechecks exact branch/service/start/end before creating a draft |
| Sample patient and OTP journey | IMPLEMENTED, SYNTHETIC | Only fictional values, demonstration code, no patient contact sent to backend |
| Booking confirmation | **SIMULATION ONLY** | Reference starts `SIM-`; no appointment ID, no write to SGiMED |
| Real official SGiMED API write | NOT AVAILABLE | Vendor contract, sandbox, credentials and schema not obtained |
| Public SGiMED write fallback | NOT AUTHORIZED / NOT ACTIVE | Endpoint discovery is not permission to transact |
| Public SGiMED self-service fallback | IMPLEMENTED | Branch-specific official booking page handoff |
| Card payments, real OTP, rescheduling/cancellation | NOT IMPLEMENTED | Vendor approval, requirements and separate acceptance tests |
| Production clinic launch | BLOCKED | Commercial, vendor, security, operations and clinical sign-off below |

## 2. Booking system architecture

**One UI, replaceable providers.** Client-facing journey = select site → choose date/branch/provider/service → verify current availability → collect *minimum necessary* contact information → establish idempotent booking intent → verify the patient (OTP if vendor requires) → payment if required → check vendor status → show actual provider-issued confirmation.

**Provider priority on activation:**
1. **Official SGiMED adapter (primary):** only after documented API contract, authorization, credential isolation, sandbox sign-off and idempotency semantics. Never send production writes from the sandbox.
2. **SGiMED public booking handoff (currently safe fallback):** if official integration is unavailable before a write, offer the patient's chosen branch's public booking page. Treat it as a NEW customer-driven confirmation, not a confirmed appointment.
3. **Programmatic public-flow API fallback (future, gated):** only if SGiMED and Phoenix explicitly authorize such use, its schema and OTP/payment requirements are documented, and legal/security approve it. Never derive write authority from a public booking-link token by assumption.

**Ambiguous writes:** If a create/verify request times out after dispatch, outcome is unknown. Never blindly retry on an alternative provider: first reconcile with the official vendor's appointment status or idempotency key to prevent duplicates. If uncertain, present **Pending verification** and escalate to reception.

**Provider contract to implement after vendor onboarding:** `availability(filters)`, `create(intent,idempotency_key)`, `send_verification(pending_ref,channel)`, `verify(pending_ref,proof)`, `status(ref)`, `cancel(ref)`, `reschedule(ref,new_slot)`. Map transport errors to consistent client statuses (`unavailable`, `slot_gone`, `patient_action_required`, `payment_required`, `pending_unknown`, `confirmed`, `cancelled`). Ensure each adapter's response is sanitized before the AI or UI sees it.

## 3. Observed SGiMED public browser flow (read-only research)

The live SGiMED frontend JavaScript served at `https://el.hb.sgimed.com` includes these route contracts:

| Website action | Observed API route | Known limitation |
| --- | --- | --- |
| Get availability | `GET /api/el/online-booking/branch-calendars/schedule` | Confirmed in read-only pilot |
| Submit booking intent | `POST /api/el/online-booking/confirm` | Frontend passes appointment object and a validation token; write NOT tested |
| Send verification | `PUT /api/el/online-booking/send-verify` | OTP contact and token flow; NOT tested |
| Verify appointment | `PUT /api/el/online-booking/appointment/verify` | Uses OTP code; potential pending/payment branch; NOT tested |
| Check pending appointment | `GET /api/el/online-booking/pending-appointment/:id` | Needs vendor contract for reference scope |
| Complete payment-required path | Payment/card-on-hold routes | Never handle card numbers or bypass gateway |
| Edit or cancel | `PUT /api/el/online-booking/appointment/:id` and `.../:id/cancel` | Authorization and ownership NOT verified |

These are **frontend route signatures**, not an official authenticated partner API specification, proof of permitted direct booking, or evidence of insecure access. Never invoke mutation endpoints with public-link tokens without explicit authority. Public booking-link tokens and any vendor responses containing staff/patient identifiers must not be stored, logged or passed to the LLM.

## 4. Production go-live gates (all required)

### A. Commercial / legal: Phoenix management (P0)
- [ ] Signed contract, monthly fee and go-live date. Client approves enabling real booking, not just test responses.
- [ ] Written Phoenix owner authorization for live patient information, appointment creation, reminder delivery and service limits.
- [ ] Verify responsibility for clinical advice, booking errors, cancellations, escalation and dispute handling.
- [ ] Document vendors and data processing roles; complete Singapore PDPA/privacy review, notice and consent wording.
- [ ] Decide whether SGiMED requires a commercial API subscription, partner agreement or a clinic-admin credential.

### B. Vendor integration: SGiMED + engineering (P0)
- [ ] Obtain current partner API documentation, sandbox, credentials, test tenant and booking flow diagram.
- [ ] Confirm branch IDs, therapist IDs, service IDs, duration, price, time zone and calendar update semantics.
- [ ] Get verified request/response schemas, typed error codes, idempotency and rate-limit guarantees.
- [ ] Confirm OTP delivery/verification flow, appointment ownership, identity and required patient fields.
- [ ] Confirm prepaid/credit-card handling: use provider-hosted checkout only; never ingest card details.
- [ ] Confirm appointments are created in clinic scheduling system, with durable booking reference and status query.
- [ ] Agree permitted fallback route and whether public website flow can be used programmatically. Until then, handoff only.
- [ ] Test cancellations, reschedules, deposits, holidays, double-booking, staff changes and no-show rules.

### C. Privacy / security: engineering + Phoenix (P0)
- [ ] Dedicated production database, separate from pilot SQLite and synthetic tests, with controlled migrations and backups.
- [ ] Minimize PII; encrypt at rest and in transit; define retention, deletion, access audit and subject-access requests.
- [ ] Never include patient names, numbers, symptoms or booking tokens in prompt context, URLs, logs or analytics.
- [ ] Authenticated booking verification with rate limits, OTP replay protection, CSRF/origin checks and abuse monitoring.
- [ ] Harden service account privileges; store rotating keys in Infisical/Vault; no clinic credentials in Git, Vercel or frontend.
- [ ] Penetration assessment, vulnerability patching, backups and restore tests, provider webhook signature verification.
- [ ] Clinic verifies published descriptions of what the AI can/cannot do and the human escalation route.

### D. QA / operating readiness: engineer + clinic (P0)
- [ ] Unit/contract tests: correct booking schema, patient consent, payment branch, OTP expiry, duplicate submissions.
- [ ] Sandbox e2e: create → verify → provider query → cancel, with test accounts and explicit cleanup.
- [ ] Fault injection: 409 slot gone, 429 throttle, 401 token expiry, 5xx outage, lost webhook, delayed confirmation.
- [ ] No duplicate real bookings when official API times out or fallback is chosen. Reconcile unknown outcomes.
- [ ] UI/accessibility and mobile tests at small widths; clear status, receipt, timezone and back/refresh handling.
- [ ] End-to-end WhatsApp tester journey and web session, plus opt-in, opt-out, and support escalation.
- [ ] Canary launch: staff-only, then selected consenting customers, then open rollout after acceptance metrics pass.
- [ ] Monitor booking completion, failed OTP, cancellation errors, provider latency, duplicate rate, and daily cost.
- [ ] Assigned incident owner, clinic reception fallback script, support hours and severity-based alerts.

### E. Production cutover / rollback (P0)
- [ ] Snapshot deployment and database; dry-run restore; rehearse reverting production writes.
- [ ] Freeze vendor schemas and credential scopes. Rotate temporary developer tokens to proper least-privilege service accounts.
- [ ] Capture dated Phoenix owner sign-off and written authorization before switching real-write flags on.
- [ ] Turn on provider writes only in separately configured production deployment; no implicit environment flag in pilot can do so.
- [ ] Reconfirm first real appointment in SGiMED under an authorized clinic operator, with explicit consent.
- [ ] Rollback: disable booking writes immediately; leave read-only availability and public self-service handoff working; reconcile pending/unknown appointments before any retry.
- [ ] Retain incident evidence without patient details; notify clinic if appointments may be affected.

## 5. Test-only rules as of 11 Nov 2026

- The `/book` page uses **current SGiMED available blocks**. It does **not** hold slots.
- Test draft is scoped to a private pilot session, expires in 12 minutes, stores only slot metadata.
- Sample contact fields remain on the tester's browser; only fictional values are allowed.
- `000000` is a visibly labelled **demo code**, not an actual SMS/OTP.
- Success returns `SIM-...` and `real_booking_created: false`. It cannot be used as an actual appointment receipt.
- Internal staff can complete a real appointment manually via the public SGiMED booking page, independently of the pilot.
- The provider router explicitly chooses `simulation` until writes are authorized; unknown live-write results must be reconciled, never automatically retried through the fallback.

## 6. Questions for Nigel / SGiMED before production

**Nigel:** Who owns clinic administrator access to SGiMED? Which sites/services are in scope? Is there a service/payment deposit? Which cancellations and refunds should patients be offered? Are patients permitted to book specific physiotherapists? What is the escalation phone? Who signs off live patient data and pays for the subscription?

**SGiMED:** Is there a supported partner REST API and sandbox? Can this application create/reschedule/cancel appointments? What are the API credentials, booking calendar IDs, rate limits and OTP verification semantics? Is the observed public booking flow allowed as an automated fallback? Do provider idempotency keys prevent duplicates? How do we reconcile an unknown transaction outcome?

## 7. Definition of done for commercial launch

**Success means:** a consenting real patient can select an actual opening, verify identity, complete required payment, receive SGiMED's actual booking reference, and find that exact appointment in the clinic system; duplicate retries and outage fallbacks are safe; staff can update policies without engineering; all necessary contract/privacy/security/operational sign-offs exist.

**Current phase:** engineering prototype only. Do not claim live booking, do not process patient details and do not enable live writes.

## 8. Native chat booking tools (11 November test release)

The chatbot, not a separate booking page, is the intended primary patient experience. The gateway now offers native JSON function tools: `search_appointments`, `prepare_appointment`, `confirm_appointment`, and `check_appointment`. The tool schema is provider-independent and remains consistent whether the backend uses a mock pilot provider or an officially approved SGiMED integration.

During the pilot, `search_appointments` queries real SGiMED public availability, while `prepare_appointment` and `confirm_appointment` write **only** to the isolated demo CRM `crm_bot_bookings`. Writes are permitted only for authenticated demo tester identities; the preparation checks an exact currently offered slot, and confirmation requires an unambiguous statement from the tester independently of the model's tool arguments. Confirmation returns `SIM-` and never a vendor appointment ID. The server appends an unmistakable customer-facing simulation disclosure to booking responses. The LLM is not asked to manufacture a fake tool call or simulate the booking workflow itself. Meta WhatsApp outgoing is separately gated and not yet enabled.

The provider swap in production must preserve the exact tool API and use a separate officially authorized SGiMED adapter with idempotency, verified contact ownership, OTP/payment, audit, and rollback. No automatic write fallback after an ambiguous provider request.
