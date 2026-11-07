---
id: BSPT-019
title: "Clean pasted transactions without losing a cent"
category: build
audiences: [all, analysts]
level: builder
duration_minutes: 9
showcase_score: 5
human_driver: relief
status: hypothesis
access: text-only
tags: [data-cleaning, structured-output, duplicates]
connects_to: [BSPT-017, BSPT-020]
---

# Clean pasted transactions without losing a cent

> **Tell a friend:** AI can prepare the rows; your checks protect the money.

**Human problem:** You copy transactions from a portal and they arrive as a messy block of dates, descriptions and amounts.

**Byte-size ProTip:** Extract a schema, preserve raw evidence, flag possible duplicates instead of deleting them, and reconcile totals.

## The before → after moment

**Safe fictional setup:** Synthetic rows:
01 Nov | CAFE A | -12.50
01 Nov | CAFE A | -12.50
02 Nov | REFUND B | +5.00

**Copy/paste demo prompt** (no private data or paid integration required):

```text
Parse the following fictional transactions into CSV columns date, description, signed_amount, possible_duplicate, source_line. Keep EVERY row and its source line; use ISO dates with year 2026; do not delete suspected duplicates. Mark the second same-day CAFE A row as a possible duplicate, not a confirmed duplicate. Then show the signed total including all rows and explain how to reconcile it.
01 Nov | CAFE A | -12.50
01 Nov | CAFE A | -12.50
02 Nov | REFUND B | +5.00
```

**What the learner should notice:** Messy text becomes structured data while ambiguity and arithmetic remain inspectable.

## Now let them try

Verify that all three source rows survive and compare the total with manual calculation.

**Evidence of learning:** 3 output rows, second flagged possible duplicate, signed total -20.00 including both charges.

**Integrity guardrail:** Never auto-post financial transactions or silently drop duplicates. Check every amount and account before import.

**LEGO links:** [BSPT-017](./BSPT-017.md) · [BSPT-020](./BSPT-020.md)

*Editorial status: curriculum hypothesis, not surveyed demand or guaranteed model behavior. Rehearse the prompt and check outputs before presenting.*
