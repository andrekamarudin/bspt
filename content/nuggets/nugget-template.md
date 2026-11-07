# Nugget authoring template

**Purpose:** Add one distinct, repeatable behavior that audiences will want to try and tell others. A card is a problem → solution Lego brick, not a slide, slogan, or general AI feature tour.

Create `cards/BSPT-NNN.md` with this YAML front matter (keep ID unique and add corresponding entry in `catalog.json`):

```yaml
---
id: BSPT-025
title: "A precise, outcome-first title"
category: work
audiences: [all, managers]
level: starter
duration_minutes: 7
showcase_score: 4
human_driver: relief
status: hypothesis
access: text-only
tags: [writing, workflow]
connects_to: [BSPT-010]
---
```

Then include these exact sections:

- `# Title` and `> **Tell a friend:**` one quotable insight.
- `**Human problem:**` specific person, frustrating situation, real aspiration.
- `**Byte-size ProTip:**` one new behavior, not a list.
- `## The before → after moment` with a **safe fictional setup**, a **copy/paste demo prompt**, and what to notice.
- `## Now let them try` with an actual participant attempt.
- `**Evidence of learning:**` observable and ideally independently testable.
- `**Integrity guardrail:**` relevant verification, confidentiality, consent or scope requirement.
- `**LEGO links:**` one or more existing cards.

## Editorial gates

1. **Distinct:** Why can't an existing card cover this?
2. **Useful:** Would a busy professional actually use it within a week?
3. **Exciting:** Does the demo show a visible, credible before/after?
4. **Runnable:** Can it work in a text chat without premium features? If not, label the dependency.
5. **Honest:** Which facts must be independently checked? No unverifiable outcome promise.
6. **Safe:** No actual client or employee data; no agent side effects without approval.
7. **Portable:** Can we mix this into several audiences' workshop narratives?
8. **Pass/fail:** Is there a specific learner action and success criterion?

Score `showcase_score` **editorially**, not as demand evidence. Track survey scores and observed practice success separately after data exist.

## Update workflow

1. Add the card and catalog entry with correct ID and links.
2. Run `node scripts/verify-nuggets.mjs`.
3. Review full diff, rehearse the prompt on a supported chat model, and record failure modes.
4. Only promote `status` to `rehearsed` after actual manual trial; to `validated` only with real learner evidence. Automated checks cannot grant those statuses.
