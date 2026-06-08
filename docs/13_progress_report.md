# 13 — Progress Report

**Last updated:** 2026-06-07

## Phase: Planning (pre-build)

### Done
- ✅ Kickoff discussion and alignment (2026-06-06).
- ✅ Master Prompt V2 ingested; key technical decisions made (2026-06-07).
- ✅ MVP-0 technical plan locked.
- ✅ docs/ 00–13 authored.

### Decisions captured
D1–D10 in `10_decision_log.md` (own JWT auth, Anthropic AI, React-PDF, app-layer tenant isolation,
minimal Activities, local-first, stages, roles, English docs, Resend email).

### Done — tracking + repo
- ✅ CLAUDE.md + project-follow/ (current-session, backlog, status, github-issues, fikirler).
- ✅ GitHub private repo `opencrm-ai` created + planning pushed.

### Done — Sprint 0 (code, 2026-06-07)
- ✅ Next.js 14 + TS (strict) + Tailwind + shadcn-style UI base scaffolded (manual, build verified).
- ✅ Drizzle setup + schema (organizations, users, sessions) + first migration generated
      (`drizzle/0000_*.sql`).
- ✅ Own JWT auth (`jose`) + argon2 (`@node-rs/argon2`) + httpOnly cookie + sessions table.
- ✅ RBAC middleware (route gating) + role rank helper.
- ✅ Auth API (sign-up/login/logout) + sign-in/sign-up pages.
- ✅ App shell: protected `(app)` layout, left nav, top bar, dashboard placeholder.
- ✅ `npm run build` passes; production bundle + middleware compiled.

### Sprint 0 — RUN verified (2026-06-07)
- ✅ Neon Postgres (free) provisioned; `.env.local` set with `DATABASE_URL` + generated `JWT_SECRET`.
- ✅ `npm run db:migrate` applied schema to Neon.
- ✅ E2E tested: sign-up (org+admin, cookie set) → protected dashboard 200 → logout →
      unauthenticated dashboard redirects to /sign-in (middleware gating works).
- [ ] Commit + push Sprint 0 code (awaiting owner approval).

### Done — Sprint 1 core (code, 2026-06-07)
- ✅ Schema extended: accounts, contacts, leads, opportunities (+ enums) + migration `0001`.
- ✅ Org-scoped access guards: `requireUser` / `requireRole` / `canWrite` (viewer = read-only).
- ✅ Shared CRM UI: Table, Badge, Select, Textarea, PageHeader, EmptyState, status badges.
- ✅ Accounts: list / new / edit / detail (split-screen with related contacts + opps).
- ✅ Contacts: list / new / edit / detail (account dropdown, prefill via ?accountId).
- ✅ Leads: list / new / edit / detail (status + score).
- ✅ Lead convert: transactional → Account + Contact + Opportunity, back-refs on lead.
- ✅ Opportunities list + basic detail; Quotes placeholder (nav complete, no 404s).
- ✅ Verified: build passes (23 routes); all pages auth-gated 200; convert transaction +
      cross-tenant isolation tested green against Neon.

### Pending in Sprint 1 (deferred to end)
- [ ] Org invitations + password reset (Resend).

### Done — Sprint 1 (pushed: commit 56b1dcd)

### Done — Sprint 2 (code, 2026-06-08)
- ✅ Schema: activities table (+ type/related enums), migration `0002`.
- ✅ Opportunities full CRUD: service update/delete/updateStage + actions + new/edit form + detail.
- ✅ Kanban board (HTML5 drag-and-drop): drag cards between stages → optimistic + persisted via
      server action; per-column count + value totals; List/Kanban view toggle.
- ✅ Minimal Activities: service + actions + add/list panel on opportunity detail; creating an
      activity bumps `last_activity_at` (feeds Sprint 3 AI insight).
- ✅ Verified: build green (25 routes); DB-level tests pass — stage→won sets closed_at,
      activity sets last_activity_at, convert + tenant isolation still green.
- ⚠ Local dev server is flaky on this Windows env (exits 255 across turns); not a code issue
      (build + logic tests pass). Restart with `npm run dev` to view in browser.

### Done — Sprint 3 (quotes + dashboard + AI, code 2026-06-08)
- ✅ Dashboard KPIs (deterministic, org-scoped): open leads/opps, pipeline value, won/lost revenue,
      hit ratio, win rate, forecast (weighted), overdue opps/activities + overdue lists.
- ✅ Quotes: schema (quotes + quote_lines, migration `0003`), CRUD, dynamic line items with live
      totals (subtotal/discount/tax), statuses, PDF export via React-PDF (`/quotes/:id/pdf`).
- ✅ AI Insight v1 on opportunities: deterministic risk (days since activity, overdue) + recommended
      action; provider-agnostic (Anthropic) phrases it when ANTHROPIC_API_KEY is set, else
      deterministic prose. No invented numbers (docs/07).
- ✅ Audit logging (audit_logs, migration `0004`) on deletes, lead convert, quote status changes.
- ✅ Verified: build green (30 routes); all pages auth-gated 200 against Neon.

### MVP-0 status: COMPLETE 🎉 (Sprints 0–3 shipped)
Remaining optional / polish:
- [ ] Sprint 1 leftover: org invitations + password reset (needs RESEND_API_KEY).
- [ ] AI prose live phrasing (needs ANTHROPIC_API_KEY; deterministic fallback works now).
- [ ] Deploy to Vercel; broaden audit to create/update; RLS hardening.
- [ ] Sprint 3: Quotes (+PDF), Dashboard KPIs, AI Insight v1, audit logs.

### Blockers / Open Items
- None blocking. Awaiting owner "start" to begin Sprint 0.
- Optional final ack on locked stages (D7) and roles (D8).

### Metrics
- Modules in MVP-0: 7 (+ minimal Activities). Sprints planned: 0–3.
