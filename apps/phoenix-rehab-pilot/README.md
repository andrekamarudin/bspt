# Phoenix Rehab · Private Working AI Evaluation

**Canonical preview:** https://phoenix.bytesizeprotip.com
**Source of truth:** this directory (frontend), `infra/phoenix-rehab/` (backend), and GitHub `andrekamarudin/bspt`.
**Host:** GreenCloud VPS, Caddy HTTPS reverse proxy → `bspt-phoenix-api:8093` in `caddy-net`. The optional Vercel project redirects to the canonical GreenCloud app; its older node API functions are not the production runtime.

## Functional routes

- `/` → `/about`: clinic evaluation overview using canonical BSPT SVG logo, marker highlight, paperclip and notebook motifs.
- `/access`: internal-test access password (no automatic entry and no public customer rollout).
- `/chat`: GPT-6 Luna via the server-side Vercel AI Gateway, optional developer-controlled model decision step, citations to official public clinic links, and read-only availability checks for a selected Singapore date. **The chatbot does not reserve or confirm appointments.**
- `/admin`: separate administrator password. Upload TXT/MD/PDF/DOCX clinic context, approve drafts before use, set tone and special instructions, schedule announcements with automatic start/end expiry, and review encrypted conversation audit trails. A six-hour cleanup task applies the configured 30-day retention default even when the site is idle.
- `/dev`: separate developer password with TOTP enrollment and verification, model decision step toggle, request caps, and additional restrictions. TOTP setup requires an authenticator scan by the intended developer.
- `/healthz`: minimal unauthenticated operational health response.

The private and admin gates are enforced on the *server*, not merely by hiding UI components. Cookies are HTTP-only, Secure and SameSite Strict. The API and chat require a private tester session. The Docker service has no public host port and runs non-root, read-only filesystem, no added capabilities, and container resource limits.

## Current availability adapter and data boundaries

`infra/phoenix-rehab/availability.py` reads SGiMED's public online-booking calendars, creates a strict allowlisted projection (branch, service, date/time and remaining capacity), and discards raw responses and booking tokens. The adapter only sends GET requests and cannot create, change, or cancel an appointment. Calendar data is cached for two minutes and may change; a displayed opening is **not held**. The selected date is Singapore local time.

The live source needs clinic/supplier authorisation confirmation before a customer-facing rollout. **Do not place patient identifiers, medical histories, case notes, or real patient files in the test chat or admin document uploads** pending explicit data-processing permission, a security/privacy review and documented consent. Publicly available clinic facts and synthetic test cases are appropriate for internal QA.

## Build and deploy

Source under `infra/phoenix-rehab/` mirrors the deployed app under `/opt/phoenix-bot/` on GreenCloud. Frontend files under `apps/phoenix-rehab-pilot/` mirror `/opt/phoenix-bot/web/`. The deployed compose file reads a private `.env` provisioned separately from repository code (verify Infisical sync before rotation); never place or export real secrets into Git, logs or chat. Persist the encrypted database under `/opt/phoenix-data` with private file permissions.

For reproducible deployments, sync reviewed files, preserve local `.env` and `/opt/phoenix-data`, run `docker compose up -d --build` in `/opt/phoenix-bot`, and verify `/healthz`, HTTPS, private redirects, API authorization, model response and container logs. Caddy's live route is `phoenix.bytesizeprotip.com → bspt-phoenix-api:8093`.

## Verification

From repository root:

```bash
node --test apps/phoenix-rehab-pilot/test/*.test.mjs
# Within a throwaway Python environment with requirements installed:
python -m unittest discover -s infra/phoenix-rehab/tests -v
```

Backend tests set *synthetic* secrets and a temporary SQLite database. They cover refusal and access boundaries, independent roles, draft upload and TOTP setup, encryption, model preflight, booking non-transactionality and PII projection. The branded frontend has tests for visual source parity and mobile layouts. CI should also run Chromium viewport QA at 360, 390, 430, 768, landscape and desktop widths.

## Release gates still requiring independent evidence

A healthy server and passing synthetic tests are **not** a live credential or patient-data QA sign-off. Before sharing beyond invited internal testers: perform manual developer TOTP enrollment; verify one authenticated real Luna answer and cost accounting through HTTPS; confirm admin permissions and retention in a browser; obtain clinic and SGiMED permission for the upstream calendar feed; independently review PDPA/data retention; confirm Figma assets are mirrored if the design master changes. Do not switch existing BotMD/WhatsApp messaging or enable transactional bookings during this evaluation.

Public factual reference: https://phoenixrehabgroup.com/about/patient-info-faq/ and https://phoenixrehabgroup.com/clinics/.

## Login repairs (11 Nov)

The admin and developer consoles now register their data-loading handlers in shared scope; JavaScript syntax and loader references are checked in CI. Direct links to /admin and /dev preserve the intended destination when pilot entry is required. First-time developer authenticator enrolment presents a QR and a manually copyable base32 code only after the separate developer password succeeds; the browser must confirm a six-digit challenge to activate 2FA. Do not print enrolment codes in logs or commit them to Git.
