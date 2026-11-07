# Five Mental Upgrades: teach the generator, not its outputs

**Teaching rule:** Every module must alter the learner's behavior, not just supply terminology. Explain **why the move works**, show an imperfect attempt, let the learner try on an unfamiliar situation, and inspect evidence. Use human stories for relevance, never for factual proof.

## 1. Design the job, not the prompt

**Human tension:** "I'm drowning in tasks and don't know where AI could genuinely help."

**Mindset:** Start from a **job-to-be-done**, not a list of AI features. Describe the current friction, the human outcome, source information, constraints and what a good result would *change*. Deciding not to use AI is a legitimate outcome.

**Five questions:** Who is struggling? What must improve? What information exists? What must not go wrong? How would we know success?

**Technique:** Convert an ambiguous wish, e.g. "make reporting easier", into a testable result: "By Thursday, the team lead needs a clear list of overdue items and their confirmed owners; never invent a deadline."

**Underlying capability discovery:** What operation is actually needed: **Clarify / Explain / Structure / Transform-Create / Critique-Test / Orchestrate-Act**? One task may combine several.

**Misconception to challenge:** "I need a list of 100 AI use cases." Better: discover a repeatable friction and choose one of the six cognitive operations.

**Practice:** Learner selects a harmless recurring task and states (a) human outcome, (b) one source, (c) observable acceptance test. Partner flags a vague success criterion.

**Success:** Can state what would make the answer good **without** mentioning an AI product or a prompt.

## 2. Brief the work, don't cast a spell

**Human tension:** "AI gives amazing answers to other people, but generic answers to me."

**Mindset:** Prompts are **work briefs**. The output quality depends partly on what is provided, what is missing, and whether success is specified. A model is not secretly connected to every file, database or past conversation.

**Briefing contract (not a mandatory template):**

- **Outcome:** "What is the useful end result?"
- **Inputs:** "Here are the actual facts/notes/source snippets, with provenance."
- **Boundaries:** "Who is the audience, what must not be assumed/done, and what needs review?"
- **Quality bar:** "How will I evaluate the result?"
- **Clarification rule:** "If essential facts are missing, ask up to 3 questions; otherwise state assumptions and proceed."

**Illustration:** "Write onboarding advice" versus "Given this fictional five-person new-starter scenario, ask what duration and roles matter, then draft an agenda with a check for participant understanding."

**Practice:** Pairs deliberately omit one decision-changing variable, compare outputs, then revise the brief. The outcome is **awareness of missing context**, not wordier prompts.

**Success:** The user could hand the same brief to a competent colleague and receive a checkable outcome. Model and product changes may alter exact prompt syntax.

## 3. Think in loops, not one-shot answers

**Human tension:** "I feel stupid when the first AI answer is wrong or doesn't understand me."

**Mindset:** Use AI as a **collaborator for different cognitive roles**, not as an oracle. The key loop is **Propose → Inspect → Challenge → Improve → Stop/ship**. Asking an AI to critique itself can surface ideas but **does not constitute independent verification**.

**Roles to invoke as needed:**

- **Tutor:** explain, ask a question, test understanding (BSPT-001/005).
- **Interviewer:** identify the 1–3 missing inputs that would change the work (BSPT-002).
- **Maker:** structure, draft, calculate or prototype (BSPT-007/020/021).
- **Constructive critic:** expose weak assumptions and reversal conditions (BSPT-014/015).

**Illustration:** A first draft meeting summary wrongly declares a proposal as approved. The learner challenges it with evidence, requests a source-backed correction and reviews the change.

**Practice:** Instructor gives a plausible but flawed output. Learners issue **one targeted correction**, not "try harder". Then they change the problem and use the same loop.

**Success:** Learner can name what failed, choose a correction and decide when additional iterations offer diminishing value.

## 4. Demand proof, not convincing language

**Human tension:** "The answer looks professional, but I fear embarrassing myself by repeating something false."

**Mindset:** Distinguish **generation** from **grounding** and **evaluation**.

**Risk ladder (BSPT teaching heuristic):**
- **Sketch:** brainstorming or low-stakes inspiration; label as draft.
- **Inspect:** manually compare to supplied facts and source snippets.
- **Test:** run numeric examples, edge cases or source checks; have a human review pivotal claims.
- **Authorize:** before external/personal/financial/regulated actions, apply domain rules and required approvals.

More risk warrants stronger checks. An AI giving its own output a high grade is not external proof.

**Illustration:** Two dashboards show 80% and 40% completion. Before choosing, ask: numerator? denominator? cohort? time frame? Both can be true when populations differ (BSPT-017).

**Practice:** Groups audit a fictional AI-generated executive statement and classify each part as **verified / inferred / unknown**, then write a reversal condition or test. Do not award verified status unless evidence is available.

**Success:** Learner rejects an unsupported attractive claim and knows what evidence to obtain next.

## 5. Build a system, not a pile of chats

**Human tension:** "I got a magical result yesterday, and today nobody can reproduce it."

**Mindset:** Think in a small **workflow**, not a sophisticated autonomous agent. The system is:

**Trigger → Inputs → AI operation → Quality check → Human approval (when needed) → Output → Feedback/record.**

**Progressive automation:** Manual chat → reusable brief/checklist → repeatable workflow → optional connected tool → guarded agent only when justified. Start with the simplest level that meets the objective.

**Key distinction:**
- **Model:** generates/reasons over the information and available context.
- **App:** manages conversation, features, stored context and policies.
- **Tool/connector:** retrieves live data or performs an authorized action.
- **Workflow:** predefined steps and checks.
- **Agent:** more dynamic selection of actions/tools, with observability and boundaries.

**Illustration:** A team wants AI to handle meeting follow-up. Stage 1: human pastes harmless notes, AI drafts decision/actions with evidence, human corrects. Stage 2: standard template. Only later, with authorization, might a tool retrieve meeting material or send an approved message (BSPT-010/022/023).

**Practice:** Learner draws the five-minute manual version of one workflow, highlights where information enters, where error can happen, and which actions require review.

**Success:** Another colleague can repeat the steps **without** relying on one person's memory or unreviewed autonomous sending.

## How the five work together: one through-line example

**Scenario (fictional):** A team lead has an upcoming weekly meeting and chaotic notes; they want to avoid promising actions nobody accepted.

1. **Job:** "Produce a trustworthy record of agreed decisions and outstanding questions."
2. **Brief:** Supply the fictional notes and define exactly what counts as confirmed; no invented owners.
3. **Loop:** Draft → inspect an ambiguous item → ask for evidence-linked correction.
4. **Proof:** Verify each declared decision against the note, not the model's tone.
5. **System:** Reuse a reviewed decision-register template; send only after a person confirms the facts and recipients.

This single sequence generates multiple free nuggets: **BSPT-002, 007, 010, 013, 014, 016, 022 and 023**. The original ability is to **connect the operation to the human task and its verification**, not to remember eight prompts.

## Capstone rule

Do **not** allow the capstone to simply replicate any of those eight demonstrations. Supply a *new fictional job*. The learner must independently select the cognitive move, specify context, plan a feedback loop, test at least one claim, and decide how to control the workflow. See [transfer assessment](transfer-assessment.md).

## What the audience should feel

The point is not to convince people that AI is magic or that they will be replaced. The emotional arc should be **recognition → clarity → agency → earned confidence**. Offer hope grounded in a repeatable demonstration and an honest safety boundary.
