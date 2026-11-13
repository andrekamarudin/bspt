# CHC GenAI survey and decision-logic explainer

**Canonical source:** `andrekamarudin/bspt`, `apps/ai-learning-discovery/`.

- **Survey:** https://training.bytesizeprotip.com/chc-genai/
- **HR logic explainer:** https://training.bytesizeprotip.com/chc-genai/logic (two tabs, Before and After)
- **Original generic survey:** https://training.bytesizeprotip.com/ (intentionally preserved).

## Why two views?

The original form was designed to showcase assorted AI features. The CHC version tests **which decisions and transferable capabilities employees most want to learn**. It keeps eight intermediate options and combines overlapping beginner/advanced concepts into six each. It does **not** claim the organization has validated these preferences. The before/after page is an explanatory design proposal and includes the exact survey-level matrix.

## Exact scoring (unchanged)

- Step 1 **frequency**: rarely/never, sometimes, most days. Step 2 **highest capability**: chat/none, files, agents/coding.
- Step 1 + Step 2 → **Step 3 recommended level**, using the `CHC_MATRIX` in `public/chc-genai/topics.js`.
- Skipping Step 1 defaults to Intermediate; selecting multiple Step 2 options chooses the highest capability (agents > files > chat).
- Respondent may override the recommendation at Step 3.
- The **selected Step 3 level** maps **directly to exactly one Step 4 topic list**. No further algorithm/scoring is applied.

The key change is **topic differentiation**, not recommendation calibration.

| Level | Before | After | Learning decision |
|---|---:|---:|---|
| Beginner | 8 feature/tasks | 6 basic capabilities | Can I use AI safely for a real task? |
| Intermediate | 8 tool labels | 8 transferable work capabilities | Can I delegate work and verify the outcome? |
| Advanced | 8 implementation topics | 6 leadership decisions | Which initiative merits investment and how is it governed? |

## Data and isolation

The CHC survey uses a separate browser sessionStorage key and prefixed `chc_b*`, `chc_i*`, `chc_a*` topic IDs. It preserves the existing Supabase backend for registration and progress tracking; it **does not create a separate database or claim CHC respondent records are physically isolated**. Before broad distribution, check any HR data-separation or consent requirements. The HR logic page is **static** and collects no answers.

## Build, tests, deployment

```bash
node apps/ai-learning-discovery/scripts/verify.mjs
```

No framework/build step; static files under `public/`. Vercel project: `ai-learning-discovery` (custom domain `training.bytesizeprotip.com`). `vercel.json` is in `public/`. The exact deployed source files are committed here and are the source of truth; OneDrive is not used for code.

## Important

The **Before** tab shows the preserved production topic labels and matrix as of 13 November 2026. The **After** tab shows the actual CHC-specific survey options. This is **not** a prediction of staff preference, course enrollment or measured business value.
