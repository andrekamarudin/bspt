---
id: BSPT-017
title: "Fix the denominator before the chart"
category: decide
audiences: [managers, analysts]
level: builder
duration_minutes: 8
showcase_score: 5
human_driver: surprise
status: hypothesis
access: text-only
tags: [data, metrics, denominators]
connects_to: [BSPT-013, BSPT-016]
---

# Fix the denominator before the chart

> **Tell a friend:** Two correct percentages can tell two different stories.

**Human problem:** One dashboard says completion is 80% and another says 40%; leaders start arguing before checking what was counted.

**Byte-size ProTip:** Demand population, unit, time window, exclusions and numerator/denominator before comparing metrics.

## The before → after moment

**Safe fictional setup:** Dataset A: 8 completions / 10 assigned staff. Dataset B: 8 completions / 20 all staff. Both for the same fictional team.

**Copy/paste demo prompt** (no private data or paid integration required):

```text
Two reports conflict: A says 8 of 10 assigned staff completed onboarding; B says 8 of 20 total staff completed onboarding. Calculate both rates, show numerator and denominator, explain in plain English why both can be true, and ask the ONE business question we must settle before choosing the KPI. Use only these provided numbers.
```

**What the learner should notice:** 80% versus 40% ceases to be a software error; the population definition is the real issue.

## Now let them try

Ask attendees which metric they would report to a department head and why.

**Evidence of learning:** Learner states 80% assigned, 40% all staff and the definition-dependent decision.

**Integrity guardrail:** Never silently select the metric that tells the most flattering story.

**LEGO links:** [BSPT-013](./BSPT-013.md) · [BSPT-016](./BSPT-016.md)

*Editorial status: curriculum hypothesis, not surveyed demand or guaranteed model behavior. Rehearse the prompt and check outputs before presenting.*
