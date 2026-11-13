# CHC GenAI survey and decision-logic explainer

**Canonical source:** `andrekamarudin/bspt`, `apps/ai-learning-discovery/`.

- **Survey:** https://training.bytesizeprotip.com/chc-genai/
- **HR logic explainer:** https://training.bytesizeprotip.com/chc-genai/logic (two tabs, Before and After)
- **Original generic survey:** https://training.bytesizeprotip.com/ (intentionally preserved).

## Before and After

**Before**: The previous decision-focused CHC flow combines AI frequency and capability into a suggested level, then asks staff to rate topics individually. The recommendation matrix remains visible only on the comparison page.

**After**: The current CHC survey asks staff to choose Beginner, Intermediate or Advanced, with **all topics shown inside each level description**. That is one selection, followed by optional feedback and registration. No matrix or separate topic-rating step. Beginner has six topics, Intermediate eight, Advanced six. This is course preference, not a skills assessment.

## Data and isolation

The CHC survey uses sessionStorage key `ai-discovery-chc-genai-v2` and prefixed `chc_b*`, `chc_i*`, `chc_a*` topic IDs. It preserves the existing Supabase backend for registration and progress tracking; it **does not create a separate database or claim CHC respondent records are physically isolated**. Before broad distribution, check any HR data-separation or consent requirements. The HR logic page is **static** and collects no answers.

## Build, tests, deployment

```bash
node apps/ai-learning-discovery/scripts/verify.mjs
```

No framework/build step; static files under `public/`. Vercel project: `ai-learning-discovery` (custom domain `training.bytesizeprotip.com`). `vercel.json` is in `public/`. The exact deployed source files are committed here and are the source of truth; OneDrive is not used for code.

## Important

The **Before** tab shows the previous CHC matrix-plus-topic-rating flow. **After** matches the current simple three-choice survey. This is **not** a prediction of staff preference, course enrollment or measured business value.
