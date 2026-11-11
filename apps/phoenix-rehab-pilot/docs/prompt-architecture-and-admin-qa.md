# Phoenix prompt architecture and admin evaluation

**Date:** 11 Nov 2026
**Implementation:** `infra/phoenix-rehab/app.py`, `phoenix_skills.py`, `review_workflow.py`; Admin tabs `/admin`.

## Layering and authority

1. **System policy** lives in version-controlled `SAFE_PROMPT`, not in a clinic editable text area. Covers permitted scope, clinical safety, confidentiality, honest appointment status, prompt injection and information handling. Developer/clinic customization cannot authorize unsafe conduct.
2. **Operational skills** are small, Phoenix-owned task playbooks in `phoenix_skills.py`: pricing/clinic information; availability and booking; service policies and handoffs; clinical limits. They are procedures, not factual records or external vendor instructions, and never grant permissions. The answering model applies them according to meaning; no deterministic topic rejection gate is introduced.
3. **Verified context** comes from server-validated clinic facts, approved documents, bounded announcements and owner-approved FAQ entries. Unapproved uploads do not become model context.
4. **Few-shot demonstrations** are user/assistant role pairs, **not system instructions**. Only explicitly published, anonymized, approved Q/A pairs from `qa_examples` are included, capped at 12 pairs / 6,800 characters. An edit becomes a draft; the previously approved revision remains active until republished. Archived records are excluded.
5. **Live conversation** and any verified CRM identity context follow the access-controlled session. Never infer identity merely because a visitor types a name/phone.

The existing optional separate Luna decision remains three-way advisory: ANSWER / ASK / OUT_OF_SCOPE. The answering model can override it. Turning it off blends semantic scope guidance into the single answering call.

## Admin evaluation

- Admin **Testing** accepts 1–20 newline-separated questions per batch. Each is an independent no-history synthetic chat run using the current model and same clinic policy, public reference material and approved examples.
- These test invocations intentionally **disable real booking tools, patient/CRM identity actions, WhatsApp sends and writes**. When relevant, they can read only the live public availability projection. A testing result is not proof that production booking tools are correct.
- Tests are sequential, foreground requests, costed in the existing `model_usage` ledger under the `testing` channel. The UI supports stopping after the current request, rerunning failures and deleting test records.
- Each generated answer is reviewed with a 1–5 rating, free-text feedback, and optional corrected ideal answer. Review feedback is stored privately; it **never** directly becomes a system prompt.
- An approved review can generate a **draft** few-shot. A low-rated response requires an edited ideal answer to create the draft. A separate publish action with an accuracy/privacy attestation is required before the bot consumes it. Examples can be edited, archived and permanently deleted after archival.
- Questions, generated answers, feedback and examples are Fernet-encrypted at rest. Admin API requires the normal protected admin session. No patient identifiers should be used in QA fixtures.
- Conversation audit shows estimated model cost and a transcript together; selecting a conversation from the Costs view opens its matching audit transcript. The cost figure remains an estimate where only token usage/list prices exist.

## Limits and follow-up

Current admin batch limit: 20 messages per submission, 8 batches per day, 100 model test calls per day, 120 examples maximum; latest 240 QA records are listed. Review test fixtures are retained until explicitly deleted, whereas ordinary chat transcripts expire under their own retention policy. Do not supply real patient records to the QA interface. Existing lightweight pattern checks may miss some personally identifying content, so clinic reviewers must anonymize text before submission.

The skill catalog is deliberately small; do not copy third-party vendor docs into it. If a procedure becomes tool-specific, check the installed integration's current API and maintain only Phoenix-specific operating decisions.
