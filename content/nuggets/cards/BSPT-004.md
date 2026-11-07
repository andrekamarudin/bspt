---
id: BSPT-004
title: "Translate jargon into human consequences"
category: learn
audiences: [all, managers]
level: starter
duration_minutes: 5
showcase_score: 4
human_driver: belonging
status: hypothesis
access: text-only
tags: [communication, audience, empathy]
connects_to: [BSPT-009, BSPT-024]
---

# Translate jargon into human consequences

> **Tell a friend:** Nobody buys 'latency'. They care that customers are waiting.

**Human problem:** Your technical explanation is accurate but colleagues outside your specialty can't see why they should care.

**Byte-size ProTip:** Translate each technical term into a real person, an observable consequence and the relevant action, without changing the facts.

## The before → after moment

**Safe fictional setup:** Technical sentence: 'The nightly batch SLA breached because the upstream ingestion dependency increased p95 latency.'

**Copy/paste demo prompt** (works in an ordinary text chat):

```text
Rewrite this technical status for a nontechnical department head. Use: (1) what happened in plain English, (2) who experiences the effect and how, (3) what is known versus not yet known, (4) next update or action. Preserve the precise facts; if customer impact is unknown, say unknown. Sentence: 'The nightly batch SLA breached because upstream ingestion increased p95 latency.'
```

**What the learner should notice:** Readers can understand the consequence while uncertainty remains visible.

## Now let them try

Translate one piece of jargon from your own role, then ask a colleague what it means to them.

**Evidence of learning:** A non-expert can describe the implication without interpreting jargon or imagined impact.

**Integrity guardrail:** Do not turn an unmeasured technical delay into an invented customer crisis.

**LEGO links:** [BSPT-009](./BSPT-009.md) · [BSPT-024](./BSPT-024.md)

*Editorial status: curriculum hypothesis, not audience demand or a guaranteed model result. Rehearse the prompt live; inspect the actual response before presenting.*
