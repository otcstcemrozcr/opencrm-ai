# 02 — MVP Scope

**Last updated:** 2026-06-07

## Principle
Do **not** build all 11 modules first. MVP-0 proves the **revenue loop** end-to-end.

## MVP-0 — In Scope
1. **App shell** — left nav, top bar, auth, org/tenant, RBAC.
2. **Auth (own JWT + RBAC)** — sign-up (first user creates org), login/logout, httpOnly cookie,
   role-based middleware. Invitation + password reset land at end of Sprint 0 / start of Sprint 1.
3. **Accounts + Contacts** — 360 basics, linked to leads/opps.
4. **Leads** — list + detail + statuses + lead score field + convert flow.
5. **Opportunities** — pipeline Kanban + list + stages + value/probability/expected close.
6. **Activities (minimal)** — record activities + maintain `last_activity_at` (feeds AI insight).
   Full calendar deferred.
7. **Quotes** — line items, discount/tax, status, versioning, **PDF export (React-PDF)**.
8. **Dashboard** — KPI cards (Open Leads, Open Opps, Pipeline Value, Won/Lost, Hit Ratio,
   Win Rate, Forecast) + Overdue Opps/Activities lists.
9. **AI Insight v1** — per-opportunity deterministic risk ("no activity in N days / risk /
   recommended action") + one grounded prose line.

## Lifecycle stages (locked)
Opportunity: New → Qualified → Discovery → Meeting → Proposal → Negotiation → Won / Lost.

## Roles (locked)
Admin · Manager · Sales Rep · Viewer.

## Quote statuses
Draft · Sent · Accepted · Rejected · Expired.

## Deferred (post-MVP-0)
Campaigns · full Reporting suite (aging/velocity/by-X) · Activities calendar · Administration depth ·
Apollo/LeadMesh/CSV/Excel import · Word export · ERP (OneOpenERP/SAP/Logo/Netsis) ·
Communication Hub (Email/WhatsApp/Telegram/Teams/Outlook/SMS).

## Definition of Done (MVP-0)
- A lead can be converted and tracked to a quoted, forecast-visible opportunity.
- Every query is org-scoped; cross-tenant access is impossible.
- Quotes export to PDF.
- Dashboard KPIs are deterministic; AI insight is grounded with no invented numbers.
- Audit logging in place for create/update/delete on core entities.
