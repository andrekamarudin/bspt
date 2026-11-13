# CHC GenAI deployment record | 13 November 2026

**Production: LIVE and independently checked.**

- Survey: https://training.bytesizeprotip.com/chc-genai/
- Interactive Before/After explainer: https://training.bytesizeprotip.com/chc-genai/logic
- Original generic survey (unchanged): https://training.bytesizeprotip.com/

## Immutable infrastructure facts

- Original Vercel project `ai-learning-discovery` (`prj_XeSNl5RZx4KZ17wWOyZUq6lh8U9l`) continues to serve the `training.bytesizeprotip.com` domain and all existing pages.
- A Vercel Project Route **rewrite** matches only `^/chc-genai(?:/(.*))?$`, forwarding those requests to `https://bspt-chc-genai.bytesizeprotip.workers.dev/chc-genai/$1`. Routing rule ID `785928df-f8d3-49f0-868d-e7e58390b74b`; deployed route version `ca49bacc-897a-48df-a2f4-514d02d4031f`.
- Cloudflare Worker `bspt-chc-genai` (account `e5b7b607cf03475fb91283953bc4b14f`) retrieves **only allowlisted** CHC assets from GitHub main. Worker code: [`edge/worker.mjs`](edge/worker.mjs), committed and independently syntax-tested. It caches source for 120 seconds.
- **No Cloudflare DNS changes.** `training.bytesizeprotip.com` remains a DNS-only CNAME to Vercel.
- New Vercel Git-linked project `bspt-training-chc` (`prj_PemxMKGYrzXOVPpPBuYJhPyJ1KRr`) was created, but its first deployment was blocked by Vercel Hobby `402 api-deployments-free-per-day` (100/day). It has **no active deployment** and does not serve the domain. It may be used for a future source-direct cutover, but is not the live origin.

## Tested before and after promotion

- Staging alias `ai-learning-discovery-39535b-routes-andrekamarudin.vercel.app`: both CHC HTML pages returned 200, correct content types and GitHub-source header. Original `/` still returned original survey.
- Cloudflare Browser Rendering displayed the Step 1–2 matrix and rendered the CHC survey's first question.
- Following promotion, `/chc-genai/logic`, `/chc-genai/`, `/chc-genai/topics.js`, `/chc-genai/app.js`, and `/chc-genai/logic.css` all returned HTTP 200 with expected source header. Original `/` returned original unchanged survey.
- Source/logic matrix and JS parser tests passed on GitHub Actions.

Automated live regression command: `node apps/ai-learning-discovery/scripts/verify-live.mjs`.

## Data and operational caveats

CHC and generic surveys share the existing Supabase registration/progress backend. CHC uses a distinct browser session key and prefixed preference IDs, **not** physically separate respondent tables. The logic explainer itself is static and collects no information. Before wide staff distribution, confirm your organization's consent, retention and data-handling arrangements.

Because the Worker pulls from public GitHub main, new approved CHC source changes become live after caching expires. Test source changes before merging. A future native Vercel deploy can replace the Worker route, after which retire the Worker and remove its route. OneDrive is only for optional distribution, never a source of truth.
