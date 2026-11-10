# Phoenix Rehab Operational Console – Review branch

**2026-11-10 status: REVIEW ONLY.** This branch contains the separated UI and the first-party Vercel Luna gateway request code. It is **not production-ready**. Keep the current production branch unchanged until secure backend authentication, managed secrets and live model usage pass end-to-end verification.

## Routes
- `/` redirects to `/about`: editorial overview, BSPT canonical SVG and field-note motifs.
- `/chat`: mobile-responsive real-model testing surface; the backend remains disabled until the security gates pass.
- `/admin`: lockable clinic console for knowledge uploads/approval, tone, special instructions, time-bound notices and conversation auditing. UI must never be mistaken for access control.
- `/dev`: separate password and TOTP enrollment, policy gating toggle, spend caps and developer controls. Enrollment requires a person to scan the QR code in their authenticator.

## Backend / security – not shipped
An isolated FastAPI implementation and local synthetic security tests exist on GreenCloud in the isolated branch checkout (`infra/phoenix-rehab`). They are **not shipped in this review branch** pending permitted Infisical-to-runtime synchronization and verification of the Vercel project-signed OIDC token, which failed closed. Do **not** expose this API to the public or remove authentication as a workaround. The project has five server-side secrets under Infisical `greencloud-infra`; none belong in Git. The attempted initial container was stopped.

Before go-live: secure secret bootstrap by authorised owner, verify OIDC JWT issuer/audience/claims and rejection of unrelated projects, TOTP enrollment, rate-limit persistence, encrypted uploads and audit, model spend and decision step, update this source-of-truth repo with tested backend code, conduct end-to-end security QA, then merge/release. All admin/dev API calls must fail closed until then.

## Model policy
The application uses `ai` SDK and `getVercelOidcToken()` in Vercel functions and selects `openai/gpt-6-luna`. Server-side deterministic checks must run before any model invocation; optional decision-mode Luna gate runs before the answer call; even when disabled, baseline safety rules remain the first system message. **Current preview does not prove live LLM calls are operational.**

## Availability connector research, HTTP only
Official global `https://hbp.sgimed.com/l/_5wgE2UA` redirects to SGiMED's online-booking-global-calendar; branch URLs lead to online-booking. The site loads `https://el.hb.sgimed.com/apibase.js` defining `https://api.hb.sgimed.com/api`, but the precise scheduling endpoint/parameters and authorised use have not been established. Do not invent or scrape appointment times. Preserve existing official calendar links.

## Validation
- `node --test apps/phoenix-rehab-pilot/test/*.test.mjs`
- Chromium responsive QA at 360/390/430/768/891 landscape/1440 viewport sizes.
- Source assets copied exactly from `andrekamarudin/bspt`.
- Figma mirror not reverified because Starter-plan API limits.
