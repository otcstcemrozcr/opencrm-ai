# 08 — Sprint Plan

**Last updated:** 2026-06-07
**Cadence:** sprint-based, PMI-aligned. Milestones = Sprint 0–3 (MVP-0).

## Sprint 0 — Skeleton + Auth
- `[DOC]` docs/ (00–13), CLAUDE.md, project-follow/.
- `[CORE]` Next.js 14 + TS (strict) + Tailwind + shadcn/ui scaffolding.
- `[DB]` Postgres/Neon + Drizzle setup + first migration (organizations, users, sessions).
- `[AUTH]` JWT (`jose`) + argon2 + httpOnly cookie + RBAC middleware.
- `[AUTH]` sign-up (creates org, Admin), login, logout.
- `[CORE]` app shell: left nav + top bar + protected `(app)` layout.

## Sprint 1 — CRM Core
- `[AUTH]` org invitations + password reset (Resend).
- `[CRM]` Accounts CRUD + detail (split-screen).
- `[CRM]` Contacts CRUD + detail, linked to accounts.
- `[CRM]` Leads list + detail + status + score.
- `[CRM]` Lead → Account+Contact+Opportunity convert flow.

## Sprint 2 — Pipeline
- `[CRM]` Opportunities list + detail.
- `[CRM]` Kanban board with drag-between-stages (optimistic + reconcile).
- `[CRM]` Activities (minimal): record + maintain `last_activity_at`.

## Sprint 3 — Quotes + Dashboard + AI
- `[QUOTE]` Quotes + quote_lines + discount/tax + versioning + statuses.
- `[QUOTE]` PDF export (React-PDF).
- `[REPORT]` Dashboard KPI cards + overdue lists (deterministic services).
- `[AI]` AI Insight v1 (per-opportunity grounded risk + prose).
- `[SEC]` audit logging + tenant-isolation test pass.

## Exit Criteria → MVP-0 Done
See `02_mvp_scope.md` Definition of Done.

## Backlog Buckets (post-MVP-0)
Now/Next/Later tracked in `project-follow/backlog.md`. High-level roadmap in `13`/charter.
