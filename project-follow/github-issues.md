# GitHub Issues — copy/paste list

**Updated:** 2026-06-07
Create these as Issues in `otcstcemrozcr/opencrm-ai`. Suggested setup:
- **Milestones:** Sprint 0, Sprint 1, Sprint 2, Sprint 3
- **Labels:** `DOC` `CORE` `AUTH` `DB` `CRM` `QUOTE` `REPORT` `AI` `SEC`
- **Project board columns:** Backlog · Todo · In Progress · Review · Done

Each item below = one Issue (title on the `###` line, body underneath).

---

## Sprint 0 — Skeleton + Auth

### [CORE] Scaffold Next.js 14 + TS + Tailwind + shadcn/ui
Set up Next.js 14 App Router, TypeScript strict, Tailwind, shadcn/ui. Add design tokens
(`#0F172A`, `#2563EB`, `#16A34A`, `#F59E0B`, `#DC2626`) and Inter/IBM Plex Sans. Base folder
structure per `docs/03_architecture_decisions.md`.

### [DB] Set up Postgres/Neon + Drizzle + first migration
Configure local Postgres (or Neon branch), Drizzle ORM, migration tooling. First migration:
`organizations`, `users`, `sessions`. Env: `DATABASE_URL`.

### [AUTH] JWT auth core (jose + argon2 + httpOnly cookie)
Implement access JWT (`jose`) + argon2 password hashing + refresh token in httpOnly cookie.
JWT carries `{ userId, orgId, role }`. Env: `JWT_SECRET`.

### [AUTH] RBAC middleware (org resolution + role guard)
Middleware validates JWT, attaches request context, enforces role per route. Foundation for
tenant isolation (org_id from token).

### [AUTH] Sign-up / login / logout
Sign-up creates org + first Admin user. Login verifies hash, issues tokens. Logout revokes session.

### [CORE] App shell (left nav + top bar + protected layout)
Protected `(app)` layout with left nav (modules), top bar (org/user), content area. Dashboard-first.

### [DOC] Set up GitHub Projects board
Create board with columns Backlog/Todo/In Progress/Review/Done; add milestones Sprint 0–3 and labels.

---

## Sprint 1 — CRM Core

### [AUTH] Org invitations + password reset (Resend)
Admin/Manager invites by email (tokenized link via Resend); invitee sets password and joins org.
Password reset via tokenized link. Env: `RESEND_API_KEY`.

### [CRM] Accounts CRUD + detail (split-screen)
List + create/edit + detail page (record left, timeline/activities right).

### [CRM] Contacts CRUD + detail
List + create/edit + detail, linked to accounts.

### [CRM] Leads list + detail + status + score
Fields: company, contact, email, phone, linkedin, source, industry, owner, status, score, ai_summary.

### [CRM] Lead → Account+Contact+Opportunity convert flow
Convert action creates linked records and stores back-references on the lead.

---

## Sprint 2 — Pipeline

### [CRM] Opportunities list + detail
Fields: account, name, stage, value, probability, expected_close, owner, competitor, notes.

### [CRM] Pipeline Kanban (drag between stages)
Kanban columns = stages (New→…→Won/Lost). Optimistic drag + server reconcile.

### [CRM] Activities (minimal) + last_activity_at
Record activities (call/meeting/demo/site_visit/follow_up); maintain `last_activity_at` on
leads/opportunities (feeds AI insight).

---

## Sprint 3 — Quotes + Dashboard + AI

### [QUOTE] Quotes + lines + discount/tax + versioning + statuses
quotes + quote_lines; subtotal/discount/tax/total; statuses Draft/Sent/Accepted/Rejected/Expired;
versioning.

### [QUOTE] PDF export (React-PDF)
Generate quote PDF server-side with React-PDF.

### [REPORT] Dashboard KPI cards + overdue lists
Deterministic services for KPIs in `docs/06_reporting_kpis.md` + Overdue Opps/Activities lists.

### [AI] AI Insight v1 (grounded per-opportunity)
Deterministic risk (days since last activity, overdue, rule-based level) + one grounded prose line +
recommended action. AI never invents numbers.

### [SEC] Audit logging + tenant-isolation tests
audit_logs on create/update/delete of core entities. Cross-tenant access tests (R1) and own-auth
security checks (R6) before MVP-0 sign-off.
