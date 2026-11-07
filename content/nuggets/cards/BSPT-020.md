---
id: BSPT-020
title: "Generate a formula, then challenge it with test cases"
category: build
audiences: [all, analysts]
level: builder
duration_minutes: 8
showcase_score: 5
human_driver: confidence
status: hypothesis
access: text-only
tags: [spreadsheets, formula, testing]
connects_to: [BSPT-017, BSPT-019]
---

# Generate a formula, then challenge it with test cases

> **Tell a friend:** A formula isn't useful until it survives the edge cases.

**Human problem:** You know the business rule but not the Excel formula, and a plausible wrong formula can spread silently.

**Byte-size ProTip:** Have AI translate the rule into a formula and build tiny expected-answer tests before you paste it into a live sheet.

## The before → after moment

**Safe fictional setup:** Fictional policy: Bonus 5% of sales above 1,000, and zero otherwise. Sales in A2.

**Copy/paste demo prompt** (no private data or paid integration required):

```text
For Excel, write ONE formula for this fictional rule: bonus is 5% of sales ABOVE 1000, otherwise zero; sales are in A2. Explain the boundary in one sentence. Give expected output for sales 900, 1000, 1100 and -5. Clearly distinguish 5% of the EXCESS from 5% of TOTAL sales. Do not assume tax, currency or other policy.
```

**What the learner should notice:** A boundary test catches the common mistake of applying 5% to the whole sale.

## Now let them try

Have attendees predict outputs before showing the formula; check by hand or in a spreadsheet.

**Evidence of learning:** Outputs 0, 0, 5, 0 and formula equivalent to =MAX(0,A2-1000)*5%.

**Integrity guardrail:** For regulated payroll or accounting rules, verify actual policy and test the formula in the production spreadsheet environment.

**LEGO links:** [BSPT-017](./BSPT-017.md) · [BSPT-019](./BSPT-019.md)

*Editorial status: curriculum hypothesis, not surveyed demand or guaranteed model behavior. Rehearse the prompt and check outputs before presenting.*
