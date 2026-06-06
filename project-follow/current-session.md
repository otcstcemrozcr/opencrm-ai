# Current Session — Compass

**Updated:** 2026-06-07

## Where we are
Planning phase **complete**. No code written yet (owner chose plan-only). All planning docs live in
`docs/` (00–13). Operating rules in `CLAUDE.md`.

## Next action (on owner "start")
Begin **Sprint 0 — Skeleton + Auth** (`docs/08_sprint_plan.md`):
1. Next.js 14 + TS (strict) + Tailwind + shadcn/ui scaffold.
2. Postgres/Neon + Drizzle setup + first migration (organizations, users, sessions).
3. Own JWT auth (`jose` + `argon2`, httpOnly cookie) + RBAC middleware.
4. Sign-up (creates org → Admin), login, logout.
5. App shell: left nav + top bar + protected `(app)` layout.

## Locked decisions (quick ref)
Own JWT+RBAC · Anthropic AI (agnostic) · React-PDF · app-layer tenant isolation · minimal Activities ·
local-first deploy · stages New→Qualified→Discovery→Meeting→Proposal→Negotiation→Won/Lost ·
roles Admin/Manager/Rep/Viewer. Full list: `docs/10_decision_log.md`.

## Open items
- Optional: owner final ack on stages (D7) and roles (D8).
- Not yet created: GitHub private repo `opencrm-ai` + Projects board.

## Don't forget
AI never invents numbers · human approval before commit/push/deploy/send · org_id on every query.
