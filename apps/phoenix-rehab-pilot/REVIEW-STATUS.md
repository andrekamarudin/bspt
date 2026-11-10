# Phoenix Rehab working evaluation — 11 November 2026

**Canonical private instance:** https://phoenix.bytesizeprotip.com on GreenCloud, not the old Vercel function preview.

Implementation has separate about, chat, admin, and developer routes. Private pilot password is required before chat/admin/dev, with independent role credentials. Developer TOTP enrollment remains a real-person authenticator step. Backend is FastAPI with encrypted SQLite, server-side request caps, strict upload approval, scheduled rules and the GPT-6 Luna AI Gateway adapter. Calendar adapter is **GET-only** and its response is reduced to public, allowlisted times. It does not book.

**Automated QA:** 27 Node frontend tests and 11 synthetic Python API/security/availability tests pass in containers (11 Nov). A container health check and public HTTPS route were also verified. These do **not** prove live credential or model QA.

**Release decision:** internal-only. Do not authorize real patient files or customer-facing messaging from passing synthetic tests. Pending: real authenticated Luna request with model spending evidence, human TOTP enrollment and browser QA, clinic/supplier authorisation for SGiMED calendar integration, PDPA review and live availability cross-check. Keep existing clinic booking and BotMD operations unchanged.

**Repo reconciliation:** PR #13 was originally review-only and did not contain the FastAPI source. This status is superseded only when the deployed source is committed and its hash is verified. The legacy Vercel API functions are not the live endpoint and the Vercel project redirects to GreenCloud.

**11 Nov login maintenance:** deployed repair of admin and developer loader scope, login form JavaScript syntax, post-pilot return-to destination, and protected manual TOTP enrolment. Synthetic regression checks pass; live human authenticator enrolment is still required.
