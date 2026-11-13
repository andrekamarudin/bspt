# CHC GenAI survey and decision-logic explainer

**Canonical source:** `andrekamarudin/bspt`, `apps/ai-learning-discovery/`.

- **Survey:** https://training.bytesizeprotip.com/chc-genai/
- **HR logic explainer:** https://training.bytesizeprotip.com/chc-genai/logic (Before, After and Final tabs; share the agreed flow at https://training.bytesizeprotip.com/chc-genai/logic#final)
- **Original generic survey:** https://training.bytesizeprotip.com/ (intentionally preserved).

## Before, After and Final

**Before**: The previous decision-focused CHC flow combines AI frequency and capability into a suggested level, then asks staff to rate topics individually. The recommendation matrix remains visible only on the comparison page.

**After (earlier simplification)**: The currently deployed CHC survey asks staff to choose Beginner, Intermediate or Advanced, with **all topics shown inside each level description**. That is one selection, followed by optional feedback and registration. No matrix or separate topic-rating step. Beginner has six topics, Intermediate eight, Advanced six. This is course preference, not a skills assessment.

**Final (agreed with CHC HR, 13 Nov 2026)**: The Formstack specification is (Q1) select Beginner, Intermediate or Advanced with all topics visible; (Q2) rate interest in each topic **only within the chosen level** (6/8/6 topics respectively); (Q3) answer four open-text prompts on current AI use and frequency, AI use cases they know how to do but have not started and blockers, desired AI use cases they do not know how to do and potential impact, and whether they have maximized AI value and what's blocking it. No initial capability/frequency scoring or automatic recommendation. The Final tab is an interactive **preview**, not a submission endpoint. The actual deployed CHC staff survey at /chc-genai/ still reflects the earlier After design until Formstack is built.

## Data and isolation

The CHC survey uses sessionStorage key `ai-discovery-chc-genai-v2` and prefixed `chc_b*`, `chc_i*`, `chc_a*` topic IDs. It preserves the existing Supabase backend for registration and progress tracking; it **does not create a separate database or claim CHC respondent records are physically isolated**. Before broad distribution, check any HR data-separation or consent requirements. The HR logic page is **static**; its final preview includes in-browser demo radio controls and textareas but submits/saves no answers.

## Build, tests, deployment

```bash
node apps/ai-learning-discovery/scripts/verify.mjs
```

No framework/build step; static files under `public/`. Vercel project: `ai-learning-discovery` (custom domain `training.bytesizeprotip.com`). `vercel.json` is in `public/`. The exact deployed source files are committed here and are the source of truth; OneDrive is not used for code.

## Important

The **Before** shows the previous matrix-plus-topic-rating flow. **After** matches the currently deployed simple three-choice CHC survey. **Final** specifies the agreed Formstack implementation and can be opened directly with `#final`. This is **not** a prediction of staff preference, course enrollment or measured business value.
