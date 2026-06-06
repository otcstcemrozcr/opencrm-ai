# 07 — AI Principles

**Last updated:** 2026-06-07

## Core Rule
**AI never invents numbers.** Every metric, KPI, count, percentage, or amount originates from a
deterministic database query. AI receives those values as structured input and only produces prose
interpretation, risk classification, and recommended actions.

## Role
AI = **Revenue Analyst**, not a chatbot. It is subtle and embedded. The CRM remains the center of
the experience. No persistent chat window in MVP-0.

## What AI May Do
- Summarize a record or a set of metrics.
- Explain a change ("hit ratio decreased by 8%").
- Identify risk ("no activity in the last 17 days → Risk: Medium").
- Recommend a next action ("Schedule follow-up").

## What AI May NOT Do
- Generate, estimate, or "guess" any numeric value shown to the user.
- Take actions (send, delete, modify records) without explicit human approval.
- Access data outside the caller's `org_id`.

## Architecture
- **Provider-agnostic** interface in `server/ai/`. Default provider: **Anthropic**. Future: OpenAI, Gemini.
- **Server-side only.** API keys never reach the client.
- **Grounded prompts.** The prompt template injects pre-computed metrics + record facts; the model
  is instructed to reference only provided figures.
- **Guardrails.** Output validated/shaped (risk level enum, action string); numeric hallucination
  checks against the provided dataset.

## AI Insight v1 (MVP-0)
Per opportunity, compute deterministically:
- days since `last_activity_at`
- overdue status (expected_close < now)
- a rule-based risk level (Low/Medium/High)
Then ask the model for **one** grounded prose line + recommended action. Numbers come from the
deterministic layer; the model only phrases them.
