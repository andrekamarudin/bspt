---
id: BSPT-001
title: "Make AI teach it again, not repeat itself"
category: learn
audiences: [all]
level: starter
duration_minutes: 6
showcase_score: 5
human_driver: confidence
status: hypothesis
access: text-only
tags: [learning, explanation, teach-back]
connects_to: [BSPT-005, BSPT-016]
---

# Make AI teach it again, not repeat itself

> **Tell a friend:** If you don't get it, change the explanation, not your self-worth.

**Human problem:** A smart professional hears an explanation twice and still doesn't get it, but doesn't want to ask a colleague a third time.

**Byte-size ProTip:** Ask for a different analogy, a worked example and a teach-back check. Simpler words alone may preserve the confusion.

## The before → after moment

**Safe fictional setup:** A colleague says: 'An API is like a waiter.' You still don't understand what is sent, what comes back, or why authentication matters.

**Copy/paste demo prompt** (works in an ordinary text chat):

```text
I still don't understand this concept: API. Don't merely repeat the definition. Explain it to a curious 15-year-old in at most 120 words. Use a NEW analogy, then one tiny workplace example showing request → response. Ask me one question to test whether I can explain it back. If I miss it, diagnose my misconception before trying again.
```

**What the learner should notice:** The AI can adjust the representation and ask for evidence of understanding instead of merely producing another paragraph.

## Now let them try

Replace API with a concept you've nodded along to but never fully understood. Answer the teach-back question in your own words.

**Evidence of learning:** Learner explains the concept accurately using their own example, not memorized phrasing.

**Integrity guardrail:** The analogy is a bridge, not a technically complete definition. Validate important technical details.

**LEGO links:** [BSPT-005](./BSPT-005.md) · [BSPT-016](./BSPT-016.md)

*Editorial status: curriculum hypothesis, not audience demand or a guaranteed model result. Rehearse the prompt live; inspect the actual response before presenting.*
