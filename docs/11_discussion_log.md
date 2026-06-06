# 11 — Discussion Log

**Last updated:** 2026-06-07

## 2026-06-06 — Kickoff alignment
- Owner shared OpenCRM AI build kickoff prompt and requested discussion before any coding.
- Confirmed product is an enterprise RevOps CRM, AI as embedded Revenue Analyst (not a chatbot),
  AI never invents numbers, multi-tenant from day 1.

## 2026-06-07 — Master Prompt V2 + key decisions
- Owner provided Master Prompt V2 (full module/UX/UI/stack/PM spec).
- Open questions raised and answered:
  - **Auth:** own JWT + RBAC (Clerk rejected). → D1
  - **First step:** plan only for now; coding in a later session.
  - **PDF:** React-PDF. → D3
  - **Infrastructure:** local-first, deploy later. → D6
- Auth decision expands MVP-0 (sessions, invitations, password reset, Resend). Captured in scope,
  schema, sprint plan, and risk register (R6).
- Owner requested the plan be written into `docs/` (00–13). Done 2026-06-07.

## Confirmations
- 2026-06-07: Owner confirmed lifecycle stages (D7) and role set (D8) — "stick to the prompt".
  Both now locked with owner ack.
- 2026-06-07: GitHub private repo created (otcstcemrozcr/opencrm-ai), planning commit pushed to main.
