---
id: BSPT-016
title: "A confident AI answer is not a verified answer"
category: decide
audiences: [all, managers]
level: starter
duration_minutes: 8
showcase_score: 5
human_driver: safety
status: hypothesis
access: text-only
tags: [fact-checking, sources, hallucinations]
connects_to: [BSPT-012, BSPT-017]
---

# A confident AI answer is not a verified answer

> **Tell a friend:** Confidence is a tone, not a citation.

**Human problem:** An AI response sounds perfectly authoritative, and someone is about to paste it into a leadership memo.

**Byte-size ProTip:** Tag claims by verifiability, require primary evidence and manually open pivotal sources. If no search tool is available, mark verification pending.

## The before → after moment

**Safe fictional setup:** Fictional claim for audit: 'Our new workflow saves exactly 30% of time for everyone.' No study or measurements supplied.

**Copy/paste demo prompt** (no private data or paid integration required):

```text
Audit this claim without treating it as true: 'Our new workflow saves exactly 30% of time for everyone.' Split it into checkable subclaims. For each, give a verification source or measurement needed, how the finding could be misleading, and status VERIFIED / UNVERIFIED / CONTRADICTED based ONLY on evidence provided. No sources are provided here; do not fabricate citations.
```

**What the learner should notice:** The polished sentence turns into an evidence queue, not a fact.

## Now let them try

Present one persuasive AI-generated claim. Ask the group which source they would actually open before repeating it.

**Evidence of learning:** No unsupported claim receives a VERIFIED status; important numerical claims require source inspection.

**Integrity guardrail:** Search results and AI-made citations may be fabricated or outdated. High-stakes claims require independent verification.

**LEGO links:** [BSPT-012](./BSPT-012.md) · [BSPT-017](./BSPT-017.md)

*Editorial status: curriculum hypothesis, not surveyed demand or guaranteed model behavior. Rehearse the prompt and check outputs before presenting.*
