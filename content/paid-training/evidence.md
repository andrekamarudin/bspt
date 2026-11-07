# Research grounding and claim discipline

The two pillars and five supporting habits are **BSPT's instructional synthesis**, not certified external standards or experimentally validated outcomes. Research below informs selected mechanisms and boundaries.

1. [Anthropic, Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents): start with simple composable workflows; use evaluation/optimizer loops when criteria are clear; agents use environment feedback and should pause when blocked or at checkpoints. **Caution:** landscape and implementation guidance evolve.
2. [OpenAI, A practical guide to building agents (Jan 2026)](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/): instruction specificity, action scopes, tests, layered guardrails and human intervention for high-risk actions.
3. [OpenAI Developers, Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals): distinguish automatic input/output/tool checks from actual human approval gates before sensitive side effects.
4. [NIST, AI RMF Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence): evaluate risks and controls, not merely perceived output fluency.
5. [OECD / European Commission, AI Literacy Framework (2026)](https://www.oecd.org/en/publications/empowering-learners-for-the-age-of-ai_65cd27d4-en.html): broad framing of engage/create/manage/shape AI and human agency; school-focused framework adapted cautiously for adult training.
6. [National Academies, How People Learn: Learning and Transfer](https://www.nationalacademies.org/read/9853/chapter/6): ability to apply concepts in unfamiliar contexts matters more than memorizing one worked example.

## Evidence rules

- AI model self-evaluation can help detect potential faults, but **does not prove its own accuracy independently**.
- Don't promise a reduction of review time without measuring the task before/after.
- Automatically passing tests demonstrate only what those tests cover; unrelated failures can remain.
- Human-above-loop does not negate legally required human approvals, duty of care or domain review.
- Treat curriculum examples as fictional until separately sourced and evidenced.
