# CHC GenAI static origin bridge

**GitHub is the source of truth:** `apps/ai-learning-discovery/public/chc-genai/`. The Worker in this folder serves only CHC HTML, JavaScript and CSS by fetching the **public, reviewed GitHub `main` branch**. It never serves the admin portal or writes to the backend.

This fallback exists because Vercel returned `402 api-deployments-free-per-day` when deploying the complete refreshed survey. The original survey at `training.bytesizeprotip.com/` remains on the existing Vercel project. No Cloudflare DNS changes are needed.

Expected origin: `https://bspt-chc-genai.<workers.dev subdomain>.workers.dev`. The Vercel project's staged external rewrite should match **only** `^/chc-genai(?:/(.*))?$` and send to this Worker. Stage first, independently verify Worker, then promote; a failed Vercel route must not affect unrelated paths.

**Limitations:** GitHub serves static source at runtime, cached 120 seconds. This is a temporary low-traffic architecture rather than a dedicated static asset deployment. If you later move back to a normal Git-linked Vercel deployment, remove the Vercel external rewrite before removing the Worker. All users' browser assets still originate from the Vercel custom domain.

Never promote an unverified route, change the existing Cloudflare `training.bytesizeprotip.com` CNAME from DNS-only, or claim the CHC pages are published until the actual custom-domain paths return 200 and the interactive tabs work.
