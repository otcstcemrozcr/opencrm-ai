# 03 — Architecture Decisions

**Last updated:** 2026-06-07

## Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript (strict), Tailwind, shadcn/ui, Recharts.
- **Database:** PostgreSQL (Neon in cloud; local Postgres/Neon branch for development).
- **ORM:** Drizzle (typed, migration-friendly).
- **Auth:** Own JWT + RBAC (no Clerk). `jose` for JWT, `argon2` for password hashing, httpOnly cookies.
- **Email:** Resend (invitations, password reset).
- **Storage:** Cloudflare R2 (documents/attachments — wired in post-MVP-0 when needed).
- **PDF:** React-PDF (pure JS, serverless-safe).
- **AI:** Provider-agnostic layer; default Anthropic. Server-side only, grounded, guardrailed.
- **Deploy:** Local-first, then Vercel (web + API routes). Later `crm.oneopenerp.com`.

## Architectural Principles
- **API-first.** Route handlers under `app/api/*`; UI consumes the same contracts.
- **Multi-tenant from day 1.** `org_id` on every business row; tenant isolation enforced at the
  query layer via a mandatory org-scoped query helper (not relying on Postgres RLS for MVP-0).
- **RBAC.** JWT carries `user_id`, `org_id`, `role`. Middleware resolves org + checks role per route.
- **Audit logs.** Create/update/delete on core entities recorded with actor + diff.
- **Deterministic metrics.** All KPIs computed in `server/services/*`; AI consumes pre-computed
  numbers only.
- **i18n-ready.** No hard-coded UI strings outside a message catalog.

## Auth Flow (own JWT)
1. Sign-up → first user creates the organization, becomes Admin.
2. Login → verify argon2 hash → issue short-lived access JWT + refresh token (httpOnly cookie).
3. Middleware → validate JWT → attach `{ userId, orgId, role }` to request context.
4. Invitations → Admin/Manager invites email → Resend link → invitee sets password, joins org.
5. Password reset → tokenized link via Resend.

## Folder Structure (target)
```
src/
  app/(auth)/  app/(app)/{dashboard,leads,opportunities,accounts,contacts,quotes}/  app/api/
  server/{db,services,ai,auth}/
  components/{ui,crm}/   lib/{utils,i18n,pdf}/   config/
docs/   drizzle/   project-follow/   CLAUDE.md
```

## Key Trade-offs
- Own auth increases security surface (R6) but removes vendor lock-in/cost. Mitigated with proven libs.
- App-layer tenant isolation chosen over RLS for MVP velocity; revisit RLS as hardening in a later phase.
