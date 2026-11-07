---
id: BSPT-012
title: "Find the change, not a fictional difference"
category: work
audiences: [all, managers]
level: builder
duration_minutes: 8
showcase_score: 5
human_driver: certainty
status: hypothesis
access: text-only
tags: [comparison, contracts, revision]
connects_to: [BSPT-016, BSPT-018]
---

# Find the change, not a fictional difference

> **Tell a friend:** Show me exactly what changed, and where.

**Human problem:** Two versions of a policy look almost identical; missing one changed sentence could cause real trouble.

**Byte-size ProTip:** Ask for a side-by-side change log supported by exact quotes and an 'unable to determine' state.

## The before → after moment

**Safe fictional setup:** Old: 'Refund requests are reviewed within 10 working days.' New: 'Refund requests are reviewed within 15 working days.' Both are fictional.

**Copy/paste demo prompt** (works in an ordinary text chat):

```text
Compare the two fictional policy snippets exactly. Produce a table: old wording, new wording, change type, practical impact, and evidence quote. If text is missing, say so. Do not infer why a change happened.
OLD: Refund requests are reviewed within 10 working days.
NEW: Refund requests are reviewed within 15 working days.
```

**What the learner should notice:** One small number becomes a visible service commitment change, without inventing management intent.

## Now let them try

Give each other two short safe paragraphs with one non-obvious change; challenge the model's claims.

**Evidence of learning:** Each reported change can be traced to both exact source passages.

**Integrity guardrail:** For legal contracts, use controlled document comparison and expert review; pasted snippets may omit context.

**LEGO links:** [BSPT-016](./BSPT-016.md) · [BSPT-018](./BSPT-018.md)

*Editorial status: curriculum hypothesis, not audience demand or a guaranteed model result. Rehearse the prompt live; inspect the actual response before presenting.*
