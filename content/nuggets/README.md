# ByteSize ProTip | The Nugget Vault

> **A modular library of problems → solutions, not a slide deck or fixed syllabus.** Each nugget teaches one useful move that a participant can try immediately and describe to a friend.

**Current evidence state:** No survey responses at the time this initial vault was drafted (7 Nov 2026). All 24 cards are *editorial curriculum hypotheses*, not validated audience demand. The numerical `showcase_score` is an internal creative judgment (1–5), not a survey result, effectiveness measurement or promise of time savings.

## Start here

- [Browse all 24 nuggets](CATALOG.md) by learn, work, decide, build.
- [Read a single card](cards/BSPT-002.md) for the standard: human problem, useful shift, realistic fictional demo, runnable prompt, audience practice, measurable success and integrity check.
- [Mix candidate bundles](selection-recipes.md), then rearrange freely. These are **LEGO pieces**, not a predetermined presentation.
- [Check sources and demo safety](evidence-and-demo-safety.md) before facilitating.
- [Add a new nugget](nugget-template.md) only if it provides a distinct problem-solving capability. Register it in [catalog.json](catalog.json) and run `node scripts/verify-nuggets.mjs`.

## Content philosophy

1. **Human first:** Start with the feeling behind a real task: confusion, overload, courage, belonging, dignity, control, hope or pride. Do not manufacture fear.
2. **One shareable ProTip:** A nugget must contain one memorable behavior shift, not a list of AI features or a vendor tour.
3. **Show, then let them do:** A short demonstration → participant attempt → observable check. The learner's achievement is the payoff.
4. **Safe and cheap:** Text-only examples work in a regular chat without premium integrations; advanced builds use local toy data and are optional.
5. **Truth before theatrics:** Every factual claim, calculation, citation or generated artifact has a verification gate. AI-generated output may be wrong.
6. **Useful after one read:** Each card contains the exact demonstration and practice, avoiding an extra tool call to discover the instructions.

**Never:** Claim a survey winner without responses, invent measured time savings or client testimonials, paste real confidential/company/personal data into an unapproved AI tool, promise the model's output is deterministic, or run a real-world agent action without explicit authorization.

## Why these building blocks

| Content pillar | Human payoff | Card count |
|---|---|---:|
| Learn | Curiosity and confidence | 6 |
| Work | Relief and clarity | 6 |
| Decide | Better judgment and control | 6 |
| Build | Pride and agency | 6 |

Eight **editorial demo candidates**, not rankings from customers: [AI interviews you](cards/BSPT-002.md), [learn through micro-challenges](cards/BSPT-005.md), [brain-dump to plan](cards/BSPT-007.md), [meeting to decision register](cards/BSPT-010.md), [polite red-team critic](cards/BSPT-014.md), [confident ≠ verified](cards/BSPT-016.md), [tiny local tool](cards/BSPT-021.md), [3-line human pitch](cards/BSPT-024.md).

These span a useful emotional arc from *I'm overwhelmed* to *I can actually do this*, but **we have not chosen a story sequence**. The audience survey, pilot feedback and facilitator rehearsal should decide that later.

## Selection rule for any workshop

For each candidate, ask:

- **Desire:** Which real audience problem does it solve?
- **Magic:** Is the before/after obvious in under 90 seconds?
- **Agency:** Can participants perform the move themselves with their own harmless task?
- **Proof:** Can we check whether it worked, rather than measure excitement alone?
- **Fit:** Does it complement, not duplicate, the other selected cards?
- **Risk:** Can we demonstrate it safely and reliably in the planned room/setup?

A strong workshop usually mixes emotional relief, practical achievement and skepticism. We should select **fewer nuggets with real practice**, not try to use all 24. The published deck, duration and final narrative remain deliberately undecided.

## Audience and follow-up

Initial potential audience: office staff and department heads, including a free pilot under discussion. No job-specific needs or topic preferences should be inferred from that fact alone.

After actual responses arrive, map their free-text problems and topic selections to `tags`, `audiences`, and `category`. Track real demand separately from editorial `showcase_score`. Rehearse chosen prompts with the actual model available for training. Optionally test next-day recall and 48-hour application; don't claim those outcomes in advance.

**No slides, no MP4, no forced story flow in this release.** The vault is the content source of truth.
