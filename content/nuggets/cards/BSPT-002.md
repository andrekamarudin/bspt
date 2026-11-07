---
id: BSPT-002
title: "Let AI interview you before it works"
category: learn
audiences: [all]
level: starter
duration_minutes: 6
showcase_score: 5
human_driver: relief
status: hypothesis
access: text-only
tags: [clarification, prompting, requirements]
connects_to: [BSPT-007, BSPT-019]
---

# Let AI interview you before it works

> **Tell a friend:** The most useful AI answer may start with a question.

**Human problem:** You ask AI to 'make a training plan' and get a polished but generic one that ignores your actual constraints.

**Byte-size ProTip:** Ask for up to three decision-changing questions before any recommendation; then require the smallest useful plan.

## The before → after moment

**Safe fictional setup:** Request: 'Plan an onboarding session for five new staff.' Missing: time, roles, what success looks like.

**Copy/paste demo prompt** (works in an ordinary text chat):

```text
I need a practical onboarding session for five new colleagues. Before proposing anything, ask me up to THREE questions that would most change the plan. After I answer, give one recommended agenda, its assumptions, and one way to tell whether it worked. Do not invent company policies.
```

**What the learner should notice:** Missing context becomes visible; the first response is a short interview instead of a confident guess.

## Now let them try

Use a real task you've postponed. Notice whether each question could materially change the outcome.

**Evidence of learning:** Every question is decision-relevant, and the resulting plan respects the answers.

**Integrity guardrail:** Don't use an endless interrogation. If context is low stakes, allow stated assumptions and proceed.

**LEGO links:** [BSPT-007](./BSPT-007.md) · [BSPT-019](./BSPT-019.md)

*Editorial status: curriculum hypothesis, not audience demand or a guaranteed model result. Rehearse the prompt live; inspect the actual response before presenting.*
