# Backlog — Now / Next / Later

**Updated:** 2026-06-07

## Now (Sprint 0)
- [ ] `[CORE]` Next.js 14 + TS + Tailwind + shadcn scaffold
- [ ] `[DB]` Postgres/Neon + Drizzle + first migration (organizations, users, sessions)
- [ ] `[AUTH]` JWT (`jose`) + argon2 + httpOnly cookie + RBAC middleware
- [ ] `[AUTH]` sign-up (creates org/Admin), login, logout
- [ ] `[CORE]` app shell (left nav + top bar + protected layout)
- [ ] `[DOC]` GitHub private repo `opencrm-ai` + Projects board + Issues

## Next (Sprint 1–2)
- [ ] `[AUTH]` org invitations + password reset (Resend)
- [ ] `[CRM]` Accounts CRUD + detail (split-screen)
- [ ] `[CRM]` Contacts CRUD + detail
- [ ] `[CRM]` Leads list/detail/status/score
- [ ] `[CRM]` Lead → Account+Contact+Opportunity convert flow
- [ ] `[CRM]` Opportunities list + Kanban (drag stage) + detail
- [ ] `[CRM]` Activities (minimal) + last_activity_at

## Phase 2 roadmap (Sprints 4–10) — see docs/08_sprint_plan.md
- [ ] S4 Activities/Tasks calendar · Notes · File attachments (R2) · Audit log viewer ⭐
- [ ] S5 Saved views/filters · Bulk actions · CSV/Excel import · Dedupe & merge
- [ ] S6 Field enrichment (account/contact/lead/opportunity)
- [ ] S7 Products/Price book · Quotes 2.0 (versioning, Word, email send)
- [ ] S8 Campaigns · Reporting suite + charts
- [ ] S9 User mgmt + invitations/reset · Roles UI · Custom fields · Notifications
- [ ] S10 Email integration · AI+ (scoring, drafts, summaries) · Comm Hub

## Later (Sprint 3 + post-MVP-0)
- [ ] `[QUOTE]` Quotes + lines + discount/tax + versioning + PDF (React-PDF)
- [ ] `[REPORT]` Dashboard KPI cards + overdue lists
- [ ] `[AI]` AI Insight v1 (grounded per-opportunity)
- [ ] `[SEC]` audit logging + tenant-isolation tests
- [ ] Post-MVP-0: Campaigns · full Reporting suite · Activities calendar · Administration depth ·
      Apollo/LeadMesh/CSV import · Word export · ERP · Communication Hub
