# CHC GenAI deployment record | 13 November 2026

The GitHub source is `apps/ai-learning-discovery/public/`, including the original generic survey, the CHC-specific survey at `/chc-genai/`, and the interactive before/after explainer at `/chc-genai/logic`.

**Currently live:** the older Vercel project `ai-learning-discovery` (`prj_XeSNl5RZx4KZ17wWOyZUq6lh8U9l`) serves `training.bytesizeprotip.com`. Do NOT infer a new page is live merely because this repository contains it.

**New Git-linked project:** `bspt-training-chc` (`prj_PemxMKGYrzXOVPpPBuYJhPyJ1KRr`) is connected to `andrekamarudin/bspt`, root directory `apps/ai-learning-discovery/public`. Project creation succeeded; its first API deployment was blocked by Vercel Hobby quota `api-deployments-free-per-day` (more than 100, 24-hour retry). As of this note it has **no successful deployment and no custom domain**.

**Safe cutover:** Obtain a READY deployment from the Git-linked project and test both CHC paths. Stage (not immediately promote) a route on the old project to proxy only `/chc-genai` and `/chc-genai/*` to the new production URL. Inspect responses and ensure all general survey and admin paths are unaffected. Promote only after smoke tests. Keep the existing custom domain's DNS and origin unchanged.

**Backend caveat:** CHC topic preference keys are prefixed `chc_` and have a separate sessionStorage key, but the registration and progress endpoints remain the existing Supabase backend. This is not a physically isolated CHC database. Obtain any required data-isolation/consent decisions before wide external distribution.

**Source rule:** GitHub is authoritative. Vercel hosts outputs, OneDrive is for user sharing only. Do not introduce HTML changes that exist only in Vercel deployment records.
