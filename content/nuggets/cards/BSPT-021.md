---
id: BSPT-021
title: "Build a tiny tool, then prove it works"
category: build
audiences: [all]
level: builder
duration_minutes: 12
showcase_score: 5
human_driver: pride
status: hypothesis
access: local-html
tags: [prototype, coding, testing]
connects_to: [BSPT-005, BSPT-023]
---

# Build a tiny tool, then prove it works

> **Tell a friend:** You don't need a computer science degree to test a small idea.

**Human problem:** You have a simple work calculator idea but think you need a software project to find out if it is useful.

**Byte-size ProTip:** Ask for one small standalone HTML file using only built-in browser features, then test it with known inputs. Keep data local and never deploy before review.

## The before → after moment

**Safe fictional setup:** Toy idea: a meeting cost estimator taking attendees, minutes, and an illustrative hourly cost.

**Copy/paste demo prompt** (no private data or paid integration required):

```text
Create ONE standalone HTML file with no libraries, remote scripts, storage or network calls. It estimates meeting cost from attendee count, meeting minutes and an illustrative hourly cost entered by the user. Show the formula and give three test cases with expected numbers. Make inputs labeled, keyboard accessible, validate negative values, and work offline. Don't claim the hourly estimate represents actual company payroll. After code, list how I can save and test it locally.
```

**What the learner should notice:** A plain-language request can produce a small interactive prototype with inspectable inputs and outputs.

## Now let them try

Use 2 people × 30 minutes × $20/hour and verify the $20 result. Change one value and check again.

**Evidence of learning:** The file opens offline, calculator handles invalid inputs and its arithmetic matches hand calculations.

**Integrity guardrail:** Treat generated code as untrusted until reviewed and tested. Never put sensitive data in an unvetted app.

**LEGO links:** [BSPT-005](./BSPT-005.md) · [BSPT-023](./BSPT-023.md)

*Editorial status: curriculum hypothesis, not surveyed demand or guaranteed model behavior. Rehearse the prompt and check outputs before presenting.*
