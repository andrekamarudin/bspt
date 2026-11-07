# Minimal Technical Literacy: 15 minutes, not an LLM engineering course

**Purpose:** Equip non-technical adults with only the concepts that make the five mental upgrades intelligible and transferable. Teach with one visual metaphor and a live test. Details are optional if the audience already understands them.

## The simplest useful model

**AI response = model capability + available context + instructions + (optional) retrieval/tools + checks.**

This is a *conceptual teaching model*, not a quantitative formula. Products differ substantially. Never imply that every chat has browsing, your company's data, durable memory or permission to act.

### 1. Model: powerful generator, not a truth database

An LLM is trained to model patterns in data and generates responses token by token; modern systems can reason and work through nontrivial tasks. That does not automatically make every claim true, complete or current. Fluency, confidence and citation-shaped text are **not** evidence.

**Micro-demonstration:** Show a compelling but unsupported fictional cost-saving claim. Ask what external evidence would be needed to trust it.

**Do not teach:** "AI just predicts the next word, so it cannot reason." Equally wrong is "AI thinks like a trusted human subject matter expert." Keep both capability and limitations.

### 2. Context: the model cannot read minds or invisible files

A chat has a bounded working context. A product may add saved preferences, conversation history, enterprise documents or retrieved snippets **only when configured, available and permitted**. A missing fact should result in a question or a marked assumption.

**Micro-demonstration:** Ask for a project update with no project facts; then supply two factual statements and explicit missing fields. Compare.

**Do not teach:** fixed universal context-window sizes or that every conversation forgets everything after a turn. Product behavior varies.

### 3. Prompts: write a brief, not an incantation

Give the **goal, relevant source information, constraints, examples and success criterion**. Ask the system to clarify decision-changing gaps and make uncertainty visible. More words are not automatically better.

**Micro-demonstration:** Vague request vs. clear result contract; let learners explain which new information did the work.

**Do not teach:** magic role prompts, compulsory XML, or one fixed prompt structure for all models.

### 4. Tools, retrieval, memory and agency: four different things

- **Retrieval** can bring external documents/snippets into working context; it doesn't certify truth or freshness by itself.
- **Memory** is product-dependent retention/reuse of relevant information, not a universal mind reading your life.
- **Tools** can search, calculate, read files or perform actions **only when the product is configured with access and permissions**.
- **Agents** coordinate dynamic steps and tool use; they require boundaries, checks and sometimes human approval. A workflow with explicit steps may be a safer starting point.

**Micro-demonstration:** Contrast "Draft an email" (generating text) with "Actually send it" (external action with a permission boundary). This distinction can prevent real mistakes.

**Do not teach:** databases, OAuth, APIs, embedding dimensions, MCP internals or vector indexes unless specialist follow-up demands them.

### 5. Variation and evaluation: rerunning is not proof

Generative responses can vary across runs and model versions. A well-phrased prompt improves *likelihood*, not certainty. Test known-answer cases, edge cases, actual sources and errors before using a result. Self-critique may help identify problems but is not independent confirmation.

**Micro-demonstration:** Ask for a formula with known boundaries; test negative, boundary and positive inputs (BSPT-020).

**Do not teach:** sampling temperature/top-p defaults or model-specific settings to all beginners. Those are specialist tuning concepts.

## What 70/30 deliberately excludes

| Exclude from the core | Why |
|---|---|
| Transformer layers, attention algebra and training objective math | Does not materially help a beginner choose or evaluate a workplace use case |
| Model rankings and subscription tier tours | Become outdated; not a transferable mindset |
| Prompt syntax trivia or magic strings | Memorization has weak transfer compared with clear briefs and checks |
| Large-agent frameworks, APIs, embeddings, vector databases | Useful in implementation tracks, not necessary to invent a safe manual workflow |
| Unverified productivity percentages | Would create false expectations before pilot measurement |

## Minimum correct understanding: five oral checks

A learner should answer these without reciting jargon:

1. **Why can a fluent AI answer still be wrong?** Because generated plausibility is not the same as sourced, verified facts.
2. **What if AI lacks essential context?** Supply permitted facts, ask it to clarify, or mark the conclusion conditional.
3. **Can asking a model to 'be careful' replace a test?** No; test actual cases or sources.
4. **Can AI send a message because it drafted one?** Not unless an authorized connected tool has permission and a real send action occurs.
5. **What makes an agent different from a one-off prompt?** More dynamic multi-step/tool-use orchestration, which requires boundaries and checks.

**Facilitator note:** These principles are supported by AI-literacy and model/tool documentation; specific product abilities must be checked on the actual day. See [evidence](evidence.md).
