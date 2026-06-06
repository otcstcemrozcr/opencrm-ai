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

## Pending confirmations
- Lifecycle stages and role set were proposed and treated as locked (D7, D8); flagged for owner's
  final ack if any change desired.
