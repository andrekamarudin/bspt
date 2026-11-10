# Phoenix Rehab — WhatsApp Cloud API sandbox

**Status, 11 Nov 2026:** Meta app and free test number created, webhook challenge verified and configured. **No real WhatsApp conversation has been sent or received, and automated replies remain disabled.** Meta placed the developer account in another security checkpoint during Graph API Explorer. All remote Meta sign-in attempts must stop; account owner should restore access on a trusted device.

This integration is a **developer-only sandbox**. It is not the real Phoenix clinic WhatsApp number, not clinic-approved production infrastructure, and not connected to SGiMED, WAHA, EHR or patient data.

## Verified Meta inventory

| Resource | Value | Status |
| --- | --- | --- |
| Meta developer app | `BSPT Phoenix WA Test`, App ID `1870450800635906` | Created in development/unpublished mode |
| Associated Meta business portfolio | `Cultifate.com`, ID `517642749086889` | **Temporary sandbox association only**; Byte Size Pro Tip portfolio was disabled for selection, and Meta blocked creation of any additional portfolio due to limits |
| Meta free sender number | `+1 555 161 6897` | Developer sandbox, not a real clinic public number |
| Sender phone number ID | `1455443810979099` | Set in Vercel |
| Messaging/WABA account ID | `2636802173432923` | Observed in Meta's test dashboard |
| Webhook HTTPS callback | `https://phoenix-wa-meta-test.vercel.app/api/whatsapp` | Meta GET challenge verified and saved |
| Webhook subscription | `messages`, v27.0 | Subscribed (alongside Meta's default event subscriptions) |
| Meta App Secret | Encrypted Vercel env `PHOENIX_WA_META_APP_SECRET` | Configured without exposing the value in Git |
| API access token | `PHOENIX_WA_ACCESS_TOKEN` | **Missing**; Meta's Generate Token flow did not complete in remote browser |
| Recipient allowlist | `PHOENIX_WA_ALLOWED_TEST_NUMBERS` | Not set; no recipient approved |
| Reply gate | `PHOENIX_WA_SEND_ENABLED=false` | Outbound disabled |

**Critical:** This developer app must not be used as Phoenix's final clinic-owned app while attached to Cultifate.com. For production use a clinic-controlled Meta business account, with its own app and approved number.

## Isolated infrastructure

- Vercel project: `phoenix-wa-meta-test` (`prj_Gls47YutiOIqLrIWMideGXBarAm1`) under Andre's Vercel team.
- Public endpoint: `https://phoenix-wa-meta-test.vercel.app/api/whatsapp`, **only** webhook handler; `/admin`, `/dev`, `/` are 404.
- Latest observed deployment including webhook token, sender ID and Meta app secret: `dpl_EEdVHGxicu9DVqd9zvoJ28ox9jg4`, `READY`.
- Source snapshot deployed from `apps/phoenix-rehab-pilot/api/whatsapp.mjs`, `engine.mjs`, and `package.json` at Git commit `4811de9a55252ad352ec52f0e8ec58cbd0f0d6e7`.
- The isolated Vercel project was created by inlining committed files (not git-linked). Reproduction requires an explicit redeploy from the three committed files and managed secrets. No code needs to be reconstructed from a web UI.
- Existing `phoenix-rehab-pilot` project with SSO-protected `/admin`, `/dev` and still-disabled model proxy was **not changed**.
- The recently purchased SIM remains in WhatsApp Business App. Nothing was migrated or deleted.

## Security contract

1. GET challenge only returns Meta's challenge when `PHOENIX_WA_VERIFY_TOKEN` matches the server-side high-entropy token.
2. POST requires the exact Meta App Secret HMAC-SHA256 signature over **raw request bytes**. Vercel automatic JSON body parsing is disabled in the handler.
3. All replies require both `PHOENIX_WA_SEND_ENABLED=true` and an explicit comma-separated number in `PHOENIX_WA_ALLOWED_TEST_NUMBERS`, and the matching Meta sender phone ID.
4. No database, transcript storage or patient-message logs; replies are deterministic public FAQ/navigation only. No clinic bookings, changes, clinical diagnosis or automated reminders.
5. Never put the App Secret, verify token, API token or test recipient personal numbers in Git, screenshots or chat. Vercel env values are managed server-side. `PHOENIX_WA_GRAPH_VERSION=v25.0` matches the Meta API testing page; webhook subscription is v27.0.
6. No durable delivery idempotency or queue: duplicates are possible on webhook delivery retries. The implementation must not expand to real patients without deduplication, opt-in/retention controls, compliance review and owner approval.
7. The code's five unit tests passed in isolated Node 22 Docker, and GitHub Actions passed at `4811de9`.

## Meta account and testing blockers

- The owner's Meta developer login was restored, allowing creation of the app and the free sandbox number. Meta's app creation required password confirmation; app was successfully created.
- Meta GET verification accepted the callback URL and verify token. The `messages` field is shown as subscribed.
- The Meta dashboard currently warns: **unpublished apps only receive test webhooks from the dashboard, not actual inbound WhatsApp traffic, including from app administrators/testers.** A dashboard sample does **not** prove live conversations work.
- The dashboard `Generate token` button did not yield an access token in the available remote browser, likely because the OAuth dialogue opens outside the current tab. Do not claim an access token exists.
- On navigating to Graph API Explorer and choosing this app, Meta redirected to a checkpoint saying the account was locked and required login on a previously used device. Remote browser access was stopped and the browser session closed; **do not initiate another cloud Meta login until explicitly reauthorised after the user completes account recovery.**
- No real send/receive test occurred. The dashboard sample-send action was attempted, but neither Meta delivery success nor a signature-verified POST log receipt was established. Keep the deliverability gate open.

## Remaining setup (after account owner verifies access in trusted local browser)

1. In Meta Developer dashboard for App ID `1870450800635906`, visit **Connect on WhatsApp → Step 1: Try it out → Generate token**. Approve the requested scopes and capture the API token **securely**, not in this GitHub repository or chat.
2. Configure `PHOENIX_WA_ACCESS_TOKEN` on `phoenix-wa-meta-test` server-side, redeploy, and validate API access. For durable testing, prefer a least-privilege system user token with access to the linked messaging account, if portfolio capabilities permit.
3. Add one user-approved tester's WhatsApp number under Meta's recipient selector and verify via the official confirmation flow (limit five).
4. Before enabling any responses, confirm subscribed app/WABA relationship and perform a Meta-signed test webhook that demonstrably returns 200. Add redacted diagnostic counters if needed; never log raw payloads.
5. Establish an appropriate test-only Live/published app configuration if Meta requires it for actual inbound messages. Do not publish a clinic-branded or patient-facing service under the unrelated Cultifate.com portfolio.
6. After verified ingress, set only that tester's number in the server allowlist and enable outbound replies. Send the tester a harmless FAQ question and verify exactly one answer, then disable replies when testing ends.

## Source and ownership

- Repository: `andrekamarudin/bspt`.
- Review branch: `feat/phoenix-meta-test-number`; PR #14 is draft, based on `feat/phoenix-operational-console`.
- Main Phoenix web code remains review-only and requires the separately documented security gates before any clinical pilot.
