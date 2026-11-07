# The minimum technical understanding | 12–15 minutes

**Learning goal:** Explain why clear contracts and independent checks work better than repeated exhortations to an AI model. No transformer math or API coding required.

1. **LLMs are capable generators, not guaranteed truth engines.** They produce plausible content based on learned patterns and current context; modern models can reason usefully but still invent facts. Fluent does not mean verified.
2. **Context is bounded and product-dependent.** The model can only use information it actually receives or retrieves through available features/tools. Missing owner/date/cost must stay unknown or trigger a relevant question.
3. **Prompt = work brief.** Goals, input facts, examples, constraints and acceptance criteria matter more than magic role words. More text isn't always better.
4. **Tools, retrieval, memory and agents are distinct.** Retrieval supplies external content; tools may calculate, read or act according to permissions; memory depends on product configuration; agents coordinate steps. Drafting an email is not sending it.
5. **Verification is external to style.** Asking the model "are you sure?" may reveal doubts but does not independently establish truth. A known-answer calculation, source quote, test run, rendered slide or logged action supplies stronger evidence.

## The mental model

```text
 HUMAN ABOVE THE LOOP
 outcome + proof + permission boundaries
             |
   model + available context
             |
      permitted work
             |
 independent / observable check
       /             \
    PASS             FAIL
   deliver      repair within limits
                     |
              escalate if blocked
```

**Human-in-the-loop remains necessary** for approval of sensitive, high-risk or irreversible actions. Human-above-the-loop is the normal design stance for safe, bounded execution, not a universal risk exemption.

## Three misconceptions to dismantle

- "Better prompts guarantee no hallucinations." They do not; stronger **verification design** reduces unnoticed errors.
- "AI must ask me questions every step." A good contract provides enough context and permits bounded low-risk correction; ask only on genuine decision-changing ambiguity.
- "An agent is automatically better than a prompt." Fixed workflows and deterministic software may be cheaper, safer and more reliable. Prefer the simplest viable approach.

## Instructor's mini demo

Show two fictional instructions:
- "Summarize this meeting, check your answer."
- "From these five numbered note lines, classify confirmed/proposed/unknown; quote the line for every confirmed decision; stop if the ownership isn't explicit."

Ask: **Which result would be easier to verify, and why?** The answer is that the second task makes evidence part of the output specification, not merely an aspiration.

### Five oral checks

1. Can a confident AI claim still be false? **Yes.**
2. Can it use files it has never been given access to? **No, not by default.**
3. Is the model grading its own response independent evidence? **No.**
4. Can it send a message merely because it drafted one? **No; sending requires an authorized action.**
5. Who owns the quality bar and permission boundary? **The human delegator, supported by real controls.**

This is sufficient foundation for the [hands-on workshop](session-plans.md). Recheck product-specific functionality before the event.
