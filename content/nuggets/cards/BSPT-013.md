---
id: BSPT-013
title: "Expose the assumptions hiding in plain sight"
category: decide
audiences: [all, managers]
level: starter
duration_minutes: 7
showcase_score: 5
human_driver: control
status: hypothesis
access: text-only
tags: [assumptions, reasoning, decisions]
connects_to: [BSPT-015, BSPT-018]
---

# Expose the assumptions hiding in plain sight

> **Tell a friend:** An assumption isn't a fact just because it's in a nice table.

**Human problem:** A confident proposal quietly relies on facts nobody has checked, and you're the one who will own the consequences.

**Byte-size ProTip:** Ask AI to classify each pivotal statement as observed, inferred, assumed or unknown; then rank what must be checked.

## The before → after moment

**Safe fictional setup:** Fictional proposal: 'All 40 employees will use our new dashboard daily, so the license pays for itself.'

**Copy/paste demo prompt** (no private data or paid integration required):

```text
Audit this fictional proposal: 'All 40 employees will use our new dashboard daily, so the license pays for itself.' List its 3–5 decision-changing assumptions. Label each observed fact, inference, assumption or unknown. State the cheapest safe way to test the top two assumptions. Do not manufacture usage, costs or ROI.
```

**What the learner should notice:** The decision shifts from accepting a smooth claim to testing what actually drives it.

## Now let them try

Give the model a safe proposal and look for one assumption you had not noticed.

**Evidence of learning:** Every claimed fact has evidence or is clearly flagged as unverified; suggested tests could realistically resolve it.

**Integrity guardrail:** The AI cannot know private facts it has not been given; ask a human owner for the evidence.

**LEGO links:** [BSPT-015](./BSPT-015.md) · [BSPT-018](./BSPT-018.md)

*Editorial status: curriculum hypothesis, not surveyed demand or guaranteed model behavior. Rehearse the prompt and check outputs before presenting.*
