# 10 — Decision Log

**Last updated:** 2026-06-07

| ID | Date | Decision | Rationale | Status |
|---|---|---|---|---|
| D1 | 2026-06-07 | **Auth = own JWT + RBAC** (not Clerk) | Full control, no vendor lock-in/cost; owner preference | Locked |
| D2 | 2026-06-07 | AI = Anthropic default behind provider-agnostic interface | Grounded discipline; future OpenAI/Gemini | Locked |
| D3 | 2026-06-07 | PDF = React-PDF | Pure JS, serverless-safe; Word export deferred | Locked |
| D4 | 2026-06-07 | Tenant isolation at app/query layer (not RLS) for MVP-0 | Velocity; revisit RLS as hardening | Locked |
| D5 | 2026-06-07 | Activities minimal in MVP-0 (record + last_activity_at) | Needed for AI insight; full calendar deferred | Locked |
| D6 | 2026-06-07 | Local-first dev, deploy to Vercel + Neon once MVP-0 stabilizes | Lower setup friction early | Locked |
| D7 | 2026-06-07 | Opportunity stages: New→Qualified→Discovery→Meeting→Proposal→Negotiation→Won/Lost | Matches vision; owner-confirmed | Locked ✓ |
| D8 | 2026-06-07 | Roles: Admin/Manager/Rep/Viewer | Matches vision RBAC; owner-confirmed | Locked ✓ |
| D9 | 2026-06-07 | docs/ written in English (project canonical language) | Primary language English; i18n-ready | Locked |
| D10 | 2026-06-07 | Email via Resend (invitations + password reset) | Required by own-auth flows | Locked |
