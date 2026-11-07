# Five supporting habits under the two principles

These are *practical moves*, not five extra philosophies to memorize. The two load-bearing principles are **human above the loop** and **outcomes with built-in proof**.

## 1. Begin with the human job

**Before:** "What can ChatGPT do?" **After:** "Who needs what to change, and how would we recognize success?"

Ask: **Who benefits? What is broken? What actual input exists? What should be different when done?** Choose a cognitive move: clarify, explain, structure, transform/create, critique/test or orchestrate/act.

**Fictional demo:** A team lead needs decisions and open questions from messy meeting notes. The goal is not "produce a summary" but "enable follow-up without fake commitments".

**Learner action:** Define their own non-sensitive job in one sentence without naming any AI product.

## 2. Write a clear brief, not a magic prompt

Supply outcome, factual inputs, audience, constraints, missing-information behavior and output format. Clarify only genuinely decision-changing details. A good work brief should also make sense to a competent human colleague.

**Before:** "Write our project report." **After:** "Using these fictional notes, identify decided / proposed / unknown actions; don't invent owners, give source lines."

**Learner action:** Give their partner the brief and ask whether they can tell what is wanted without extra explanation.

## 3. Design proof as part of the requested outcome

For each output property define the cheapest valid **receipt**, not a vague exhortation to "be accurate".

| Intended result | Built-in proof |
|---|---|
| Correct arithmetic | Known-answer fixtures, total reconciliations and boundary tests |
| Faithful meeting decisions | Exact supporting line for each decision; unmatched items are UNKNOWN |
| Working code / prototype | Tests, local run and evidence from the rendered UI |
| Readable slide deck | Render every slide, inspect clipping and contrast, verify notes and file exists |
| Reputable factual summary | Open sources, trace pivotal claims, expose unresolved conflicts |
| Safe workflow | Permissions/approval gates, dry runs, logs and stop rules |

This is **not** a promise every creative quality can be proved automatically. Where judgment is subjective, make a rubric and present only the judgment call to the human.

**Learner action:** Write three concrete acceptance checks; include one "must NOT happen" item.

## 4. Let AI check, repair and stop without nagging you

**Loop:** Define → Produce → Check → Diagnose → Repair → Deliver or Escalate.

For routine, low-risk work, the AI can execute bounded self-correction against real checks. **Model-only self-review can catch possible flaws but cannot certify factual claims**; avoid circular "I have checked myself" approval.

Define a retry limit/stop condition and preserve successful tests. When a check fails, tell the model the observation (e.g. "row count 8, expected 9"), not a vague "try harder".

**Learner action:** Deliberately introduce one error into a fictional output and specify how an automated or source-based checker would catch it.

## 5. Govern exceptions instead of micromanaging each step

The human **above** the loop chooses safe delegation scope and escalation criteria.

- **Routine, reversible, checkable:** AI handles and reports the evidence.
- **Uncertain or judgment-heavy:** AI prepares options; human chooses.
- **External, sensitive, high-stakes, irreversible:** AI prepares a preview; pause for exact-operation authorization and appropriate review.
- **Impossible to verify:** mark UNKNOWN and request the minimal evidence or specialist decision.

**Learner action:** Mark an imaginary agent workflow with green (autonomous safe), amber (review judgment), red (approval required) checkpoints.

## One cross-cutting template: Outcome + Proof + Boundaries

```text
HUMAN OUTCOME: Who needs what changed?
DELIVERABLE: What artifact/state should exist?
INPUTS: What facts and sources are available? What must remain unknown?
DONE WHEN: What 3-5 properties must pass, including negative cases?
RECEIPT: What test, real source, screenshot or log proves each one?
AUTONOMY: Which safe steps may AI choose and retry itself?
BOUNDARIES: What requires approval, what is forbidden, and when to stop?
RETURN: Finished work + pass/fail/unknown ledger + exceptions only.
```

**Mindset check:** If every time the model makes a small mistake you need to type the next correction, the outcome or test design probably needs improvement. If it acts outside its permissions, the controls are inadequate regardless of prompt quality.

## How this generates the 24 freemium nuggets

One abstract move yields many examples:
- **Better briefs** produce AI interviewing you (002), audience-specific communication (009) and reusable templates (022).
- **Built-in receipts** produce transaction reconciliation (019), spreadsheet boundary tests (020), citation-backed comparisons (012) and denominator scrutiny (017).
- **Humans above loop** produce decision registers (010), critique loops (014) and approval-gated agents (023).
- **Human outcomes** produce relatable explanation (001), difficult messages (008) and ethical three-line stories (024).

The learner's win is to **generate their own 25th** without knowing the 24 example prompts.
