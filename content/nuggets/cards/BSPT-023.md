---
id: BSPT-023
title: "Design an agent with brakes, not just a brain"
category: build
audiences: [managers, analysts]
level: advanced
duration_minutes: 11
showcase_score: 5
human_driver: safety
status: hypothesis
access: text-only
tags: [agents, workflow, human-approval]
connects_to: [BSPT-011, BSPT-014]
---

# Design an agent with brakes, not just a brain

> **Tell a friend:** A smart agent needs a brake pedal.

**Human problem:** Leadership wants an AI agent to monitor shared inboxes and send replies automatically, but nobody has defined who can authorize sending.

**Byte-size ProTip:** Map observe → propose → human approve → act → verify, with permissions, failure modes and an audit trail before enabling execution.

## The before → after moment

**Safe fictional setup:** Fictional process: inspect requests for a shared team mailbox, draft replies, send only after named reviewer approval.

**Copy/paste demo prompt** (no private data or paid integration required):

```text
Design a SAFE AI-assisted workflow for a fictional shared mailbox. It can read only approved request messages, classify them, and draft a reply. Sending is DISABLED until an authorized human approves the exact recipient and text. Show steps in sequence, who controls each transition, what gets logged, how errors are detected, and how to stop/reverse. Do not request credentials or claim real integration exists.
```

**What the learner should notice:** The interesting part of an agent is not autonomy alone; trustworthy boundaries make it deployable.

## Now let them try

Give attendees a proposed agent and ask them to place STOP/APPROVAL markers where irreversible actions occur.

**Evidence of learning:** No autonomous send, permission escalation or secret leakage; clear test and shutdown path.

**Integrity guardrail:** This is an architecture exercise, not authorization to connect to mailboxes or send messages.

**LEGO links:** [BSPT-011](./BSPT-011.md) · [BSPT-014](./BSPT-014.md)

*Editorial status: curriculum hypothesis, not surveyed demand or guaranteed model behavior. Rehearse the prompt and check outputs before presenting.*
