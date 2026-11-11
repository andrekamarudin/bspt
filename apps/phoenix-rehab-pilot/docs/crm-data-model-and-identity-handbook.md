# Phoenix Rehab CRM: pilot data model and identity controls

**Started:** 11 November 2026. **Status:** Internal dummy CRM only.
**Deployment:** GreenCloud private pilot, isolated encrypted SQLite database, not SGiMED's actual patient directory.
**Commercial switch:** Separate explicit authorization before importing or writing real patient records.

## 1. Facts versus proposed fields

The public SGiMED booking frontend shows a booking intent using an `appointment` object and validation token; a later OTP verification request uses `token`, `otp_code`, `email`, and `mobile`. The availability projection contains branch, service, practitioner, start, end, duration and remaining capacity. This confirms the browser flow has contact/appointment/verification concepts, **not** that these are the final vendor-required fields for the approved partner API.

**Observed directly (public website):**
- Clinic/branch location and therapist calendars, service names, start/end/duration.
- Appointment object, a browser validation token, and an asynchronous OTP verification stage.
- Email and mobile fields in the OTP step.
- Payment and pending-appointment branches in the website flow.
- No verified provider API write authorization or official vendor schema.

**Proposed Phoenix-specific CRM fields (not verified SGiMED requirements):**
- A stable customer ID; display name, preferred branch/language; optional email/mobile; contact preferences; verification provenance and consent timestamps.
- Separate appointment ID, customer FK, clinic/service/therapist FKs, start/end/time zone, status, origin channel, cancellation reason, idempotency key, audit timestamps.
- Vendor mapping identifiers and reconciliation state, *not* guessed from a public booking token.
- Payment status and invoice reference. Do not store card details.
- Conversation/session and events linked by a stable customer ID; distinguish verified WhatsApp sender from unlinked website visitor.
- Explicit privacy and retention controls, and independent consent for service versus marketing communication.
- **Do not** add NRIC, date of birth, medical diagnoses, treatment notes or patient records to bot memory by default. These require a separate medical-data review.

## 2. Proposed relational model

| Table | Main fields | Purpose |
|---|---|---|
| `crm_customers` | customer_id PK, encrypted display name, demo role, source, external patient ID nullable, is_demo, created | Single customer profile |
| `crm_contact_identities` | identity_id PK, customer_id FK, channel, encrypted E.164 value, keyed HMAC lookup, provenance | Private, verified channel mapping |
| `crm_appointments` | appointment_id PK, customer_id FK, branch, service, practitioner, start/end, status, vendor ID nullable, payment status, is_demo | Appointments separated from customers (one-to-many) |
| `crm_contact_consents` | customer_id FK, purpose, state, updated | Messaging and privacy scope |
| `crm_web_invitations` | HMAC token hash, customer_id, issued/expiry/used | Single-use owner-issued website identity credential |
| `crm_web_bindings` | HMAC pilot session, customer_id, link/expiry | Website recognition without relying on user-typed identity |
| `crm_events` | id, customer_id, type, time | Audit of safe, non-clinical state changes |
| `crm_provider_mappings` | customer_id or appointment_id, provider, encrypted external identifier, verification date | Future SGiMED account/appointment reconciliation |
| `crm_schema_version` | version, applied_at | Database migrations |

### Later, after vendor approval

Normalize branches, services and practitioners to separate tables with actual SGiMED IDs; introduce message-session ownership, notification delivery/opt-out, invoices, consent history and relationship (parent/child booking) tables. Keep clinical records in a separate access-controlled health system, **not** automatically in the front-desk LLM CRM.

## 3. Dummy records

- **Andre:** a test customer with his pilot WhatsApp number, two explicitly fictional appointments.
- **Nigel:** a test clinic-owner customer with his pilot WhatsApp number, two explicitly fictional appointments.
- Demo records never have SGiMED patient/appointment IDs. Status is `demo_only`, payment `not_charged`, source `synthetic_seed`.
- Phone numbers and names are encrypted on disk. A keyed HMAC permits exact lookup without plaintext indexes.
- No actual SGiMED appointment data is downloaded into the CRM. Demos can be discarded without affecting clinic systems.
- The contact numbers are exclusively for internal identity tests. Do not treat demo consent status as evidence of production marketing consent.

## 4. Bot recognition and channel security

**WhatsApp:** a signed Meta webhook authenticates the provider, enforces the exact test-number recipient, then checks an allowlisted sender. The sender number is matched by a keyed HMAC to a test contact identity; only the matching **fictional appointment** summary is passed to Luna. A WhatsApp display name or phone mentioned in text is *never* authentication.

**Web chat:** shared pilot password does not identify a person. The clinic admin generates an individually addressed, 15-minute, one-use secret link for either demo tester. It must be opened in that tester's browser after the pilot password. The token is sent in the URL fragment and removed immediately from browser history; only its HMAC is stored. The 12-hour binding is scoped to the browser's HttpOnly pilot cookie; admin can revoke links. Ordinary messages saying “I am Nigel” or including a phone number cannot change CRM identity.

**Authorization:** only the clinic administrator can read the roster or issue/revoke identity links. Linked visitors can see *their own* demo profile and entries. All CRM endpoints remain protected by same-origin pilot access; no new public patient search endpoint exists.

**LLM boundaries:** only first name and limited synthetic appointment descriptions enter the prompt. No raw phone numbers, actual medical histories, API secrets or patient IDs. Prompts explicitly describe every CRM appointment as a fictional sample; the bot must never claim an actual SGiMED reservation.

**Limit:** inbound/outbound Meta real testing is still blocked until app-secret, access-token, phone-number ID and test recipients are properly configured on GreenCloud. Do not claim phone-origin recognition has been exercised on the live Meta number.

## 5. Productionization questions

- Vendor: how is SGiMED patient identity matched? Does the supported API provide stable patient IDs and duplicate-detection rules? Can a mobile number map to more than one patient or a parent/child? Which fields are mandatory per service?
- Clinic: how should data from existing records be imported, merged, corrected and erased? Who may see appointment history? Does reception authenticate clients independently?
- Legal/privacy: Singapore PDPA notices, retention, consent and audit; mandatory privacy segregation for treatment notes.
- Security: verified WhatsApp numbers can be recycled, and account ownership can change. Require re-verification or a patient-authentication step before exposing actual appointment history in production. A signed webhook alone does not prove long-term patient identity.
- Operations: opt-in messaging, multi-channel conversation stitching, data correction workflow, staff permissions, backups, SQL migrations, and vendor synchronization.
- Booking: keep **simulation-only** appointments separate. Do not merge with live SGiMED history without a verified reconciliation step and explicit client approval.

## 6. Acceptance criteria for this pilot

- Two encrypted customer records and four fictional appointment records are present, isolated from the live appointment read cache.
- Admin shows masked numbers and separate per-customer appointment cards.
- Each approved test WhatsApp number resolves to the right customer *in a signed/tested handler* once Meta is configured.
- Web requires a one-use link and cannot be impersonated by typing a name or phone.
- A tester's LLM context contains only their own fictional appointments.
- Revoked/expired links do not permit recognition; no unauthenticated lookup of the roster.
- Tests and CI pass, GreenCloud route is healthy, no real SGiMED write or customer import.

**Related:** [Booking productionization handbook](booking-productionization-handbook.md), [Phoenix PR](https://github.com/andrekamarudin/bspt/pull/13).


## 7. Native appointment tool calls with mock provider (11 Nov)

The chatbot and the signed WhatsApp test handler can call standard OpenAI-style tools:
`search_appointments(date,branch,service)`, `prepare_appointment(date,branch,service,start)`,
`confirm_appointment()`, `check_appointment()`.

Luna receives the same JSON function schemas whether the active implementation is a mock provider or a future officially licensed SGiMED provider. The model is not asked to simulate a tool call or to fake a booking receipt. The backend parses real `assistant.tool_calls`, executes allowlisted functions, returns `role=tool` results, and asks Luna to respond. During the pilot, all writes go to the private `crm_bot_bookings` table, exclusively for verified tester identities. This table has `is_demo=1`, a `SIM-` reference and a NULL SGiMED booking ID.

**Important safety invariant:** Only a real, current SGiMED GET slot can be prepared. A separate explicit confirmation reply (e.g., `confirm`) is mandatory before the mock write; model-generated arguments cannot substitute for customer confirmation. Confirmed simulated appointments appear under that tester's CRM profile. Every user-facing booking interaction is labelled simulated by application code, independently of what the model thinks.

On eventual productionization, replace the implementation behind the same tool contract with an approved vendor adapter, maintaining idempotency, no duplicate failover after ambiguous write, clinic signoff and safe reconciliation.

**Not enabled:** Live vendor appointment creation, real OTP/payment and sending WhatsApp responses until Meta test credentials and signed delivery checks are complete.
