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

---

# Phase 2 — Post-MVP-0 Roadmap (Sprints 4–10)

MVP-0 (Sprints 0–3) is complete and deployed. The following sprints turn it into a full enterprise
CRM. Ordered by value + dependencies. Each sprint is shippable on its own.

## Sprint 4 — Activities & productivity ⭐ (start here)
- `[CRM]` Activities/Tasks: full calendar + list view, due/reminder, complete toggle, filters.
- `[CRM]` Notes on every record (account/contact/lead/opportunity), shown in timeline.
- `[CRM]` File attachments via Cloudflare R2 (upload/list/download/delete).
- `[SEC]` Audit log viewer (admin screen over existing audit_logs).

## Sprint 5 — Data quality & list UX
- `[CRM]` Saved views + advanced filters per list (status/owner/date/value, sortable columns).
- `[CRM]` Bulk actions (assign owner, change status, delete).
- `[CRM]` CSV/Excel import (accounts, contacts, leads) with column mapping.
- `[CRM]` Duplicate detection & merge (accounts/contacts).

## Sprint 6 — Field & entity enrichment
- `[CRM]` Account: currency, payment terms, credit limit, parent account (hierarchy), status, rating.
- `[CRM]` Contact: salutation, department, mobile, secondary email, reports-to, GDPR/KVKK opt-out.
- `[CRM]` Lead: rating, estimated value, UTM/source fields, do-not-contact.
- `[CRM]` Opportunity: product line, next step, loss reason, forecast category, currency.

## Sprint 7 — Products & Quotes 2.0
- `[QUOTE]` Products / Price book catalog (name, sku, unit price, tax, currency).
- `[QUOTE]` Quote line items selectable from catalog; quote versioning UI.
- `[QUOTE]` Word export; send quote via email (Resend) with timeline entry.

## Sprint 8 — Campaigns & Reporting
- `[CRM]` Campaigns: type (email/event/webinar/linkedin), source, member leads, ROI
  (leads/opps/quotes/revenue).
- `[REPORT]` Reporting suite: lead aging, conversion, source performance, revenue by
  salesperson/team/industry/product/campaign, opportunity aging, forecast 30/60/90.
- `[REPORT]` Charts (Recharts) + saved report views + CSV export.

## Sprint 9 — Administration & platform
- `[AUTH]` User management + invitations (Resend) + password reset (deferred from Sprint 1).
- `[SEC]` Roles & permissions admin UI (over existing RBAC).
- `[CORE]` Custom fields (per-entity, basic), tags/labels, company branding & settings.
- `[CORE]` Notifications (overdue / assignment) via email + Telegram.

## Sprint 10 — Communication Hub & AI+
- `[CRM]` Email integration: send from a record, log to timeline.
- `[AI]` Lead scoring (rules + AI explanation), email draft suggestions, "focus this week"
  summary, meeting-note summarization — all grounded, no invented numbers.
- `[CRM]` Communication Hub: WhatsApp Business / Telegram channels (future).

## Notes
- AI features always follow `07_ai_principles.md` (deterministic numbers; AI only phrases).
- Multi-tenant org-scoping + audit logging apply to every new entity.
- Sprints 4–6 are the highest day-to-day value; 7–8 deepen revenue ops; 9–10 are platform/scale.
