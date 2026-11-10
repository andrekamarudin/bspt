# Phoenix Rehab: WhatsApp Cloud API test-number integration

Status (11 Nov 2026): **code staged on review branch; NOT connected to a Meta app and NOT live**. This document is for the isolated developer sandbox, not real patient traffic. Existing WhatsApp Business App registration and purchased SIM must remain untouched.

## Architecture and security
Meta's free developer test number -> public HTTPS callback \`/api/whatsapp\` -> signed webhook verification -> **explicit allowlist of up to five verified tester numbers** -> deterministic, public-clinic FAQ engine -> Meta Cloud API reply.

- No database, no transcript storage, no content logs, no SGiMED access, no appointment mutation.
- The reply engine is deliberately limited to general clinic information and official booking links. It is not the still-disabled Phoenix Luna backend, nor is it connected to WAHA.
- Every POST must present the Meta App Secret HMAC-SHA256 signature of the **raw** body. Wrong signatures reject with 403.
- GET handshake requires a separate configured verify token. No secret defaults.
- Outbound replies are **off by default**. Set \`PHOENIX_WA_SEND_ENABLED=true\` only for an authenticated Meta test number AND allowlisted testers.
- This is an integration smoke test, not a production chatbot. No durable idempotency or delivery ledger: Meta retries could duplicate replies if the platform times out mid-send. Do not use real patient numbers.
- The Vercel preview is currently behind Vercel SSO protection. Meta's webhook callback cannot verify through that login wall. Before Meta setup, configure a **dedicated, public, HTTPS callback** with path-level isolation or a separate test deployment. Never disable protections for Phoenix's \`/admin\` or \`/dev\`.

## Environment variables (server-side only)
| Variable | Purpose |
| --- | --- |
| \`PHOENIX_WA_VERIFY_TOKEN\` | Random 32+ byte verify token that must match the token entered in Meta → WhatsApp Configuration → Webhook |
| \`PHOENIX_WA_META_APP_SECRET\` | Meta developer app secret for HMAC signature verification |
| \`PHOENIX_WA_ACCESS_TOKEN\` | Meta test-token/API credential; treat short-lived developer tokens as expiring |
| \`PHOENIX_WA_PHONE_NUMBER_ID\` | Meta-generated test **phone number ID**, not the visible phone number |
| \`PHOENIX_WA_ALLOWED_TEST_NUMBERS\` | Comma-separated permitted WhatsApp numbers, E.164 digits without the \`+\` sign |
| \`PHOENIX_WA_SEND_ENABLED\` | Must be explicitly \`true\` to reply |
| \`PHOENIX_WA_GRAPH_VERSION\` | Optional; defaults to \`v26.0\` |

Never commit tokens, app secrets, telephone numbers or patient messages to this repo. Use Infisical/Vercel's server-side environment settings; never expose secrets to browser bundles.

## Setup once Meta login is available
1. Sign in at https://developers.facebook.com/apps/ and create a **Business** app with the **WhatsApp** use case under a development BSPT or clinic-controlled portfolio. Do **not** add or migrate the user's new SIM for this sandbox.
2. Under WhatsApp → API Setup, note the free test phone number's ID and WABA ID. Add/verify only consenting testers (Meta limit: five). Generate a temporary API token for the smoke test.
3. Configure the isolated HTTPS callback URL ending in \`/api/whatsapp\`, enter \`PHOENIX_WA_VERIFY_TOKEN\` in Meta, and subscribe to the \`messages\` webhook field. The callback must answer Meta's GET challenge.
4. Retrieve the Meta App Secret from the app's Basic Settings and install the remaining server-side secrets. Keep send disabled until signed webhook receipt is proven.
5. Send Meta's \`hello_world\` test template, reply from an approved tester's phone to open the service window, then enable sends and check that exactly one authorised FAQ answer arrives.
6. Verify 403 for a bad signature, silent ACK for an unapproved sender or different test number, and no deliveries on non-text messages. Disable sending again when not actively testing.
7. For a durable service, move to a long-lived system-user token, persistent deduplication/consent log, retention policy, and clinic-verified approvals before expanding beyond the sandbox.

## Verified deployment (11 Nov 2026)

A **standalone, publicly reachable** webhook-only Vercel project has been deployed. No Phoenix web UI, admin or developer console is present.

- Project: `phoenix-wa-meta-test`, ID `prj_Gls47YutiOIqLrIWMideGXBarAm1`, in the same Vercel team.
- Callback: `https://phoenix-wa-meta-test.vercel.app/api/whatsapp`.
- Deployment: `dpl_CqJtGKx3s6idrwAn3spvh6jtB8G6`; state `READY`.
- Source snapshot: `api/whatsapp.mjs`, `engine.mjs` and `package.json` from `apps/phoenix-rehab-pilot` at `4811de9a55252ad352ec52f0e8ec58cbd0f0d6e7`, deployed with Vercel's inline files API.
- Verified via GreenCloud HTTP: `GET /api/whatsapp` -> 503 (no verify token); `POST /api/whatsapp` -> 503 (no Meta App Secret); `GET /admin` -> 404, `GET /dev` -> 404, `GET /` -> 404. These are expected fail-closed results before configuring secrets.
- This isolated project is not Git-linked. To reproduce deployment, create an inline Vercel deployment from these three committed files, with framework unset and Node 22, then configure the server-side Meta environment variables and redeploy. The source of truth is GitHub, not a manually edited Vercel bundle.
- The existing SSO-protected Phoenix web app was **not changed**.
- Meta login credentials were stored securely in Unbrowse, Facebook login/email verification succeeded, but Meta Developer then demanded additional identity verification (including a human reCAPTCHA). The developer app and test number were **not created**. Account owner must finish this checkpoint directly on Meta before enrollment.
- Once Meta account access is restored, complete the steps above and set the phone number ID/app secret/test token on this standalone project only.

## Existing infrastructure state
- Source: `andrekamarudin/bspt/apps/phoenix-rehab-pilot`, review branch `feat/phoenix-operational-console`; sandbox changes in `feat/phoenix-meta-test-number`.
- Production web app: `phoenix-rehab-pilot` remains SSO-protected; no patient-facing WhatsApp traffic enabled.
- Purchased WhatsApp Business App number remains registered; do not delete its account.
