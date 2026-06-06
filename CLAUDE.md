# CLAUDE.md — OpenCRM AI

Operating rules for any AI session working on this repository. Read this first, then
`project-follow/current-session.md` and `docs/`.

## What this is
OpenCRM AI — an AI-native Revenue Operations (RevOps) platform. Enterprise CRM, **not** a chatbot.
AI is an embedded Revenue Analyst. Source of truth: `docs/` (00–13).

## Hard rules
1. **AI never invents numbers.** Every metric/KPI/count/amount comes from a deterministic database
   query. AI only interprets results in prose. See `docs/07_ai_principles.md`.
2. **Human approval before commit / push / deploy / send.** Never run these without explicit OK.
3. **Analyze before code.** Plan first, get approval, then implement. Do not write code unprompted.
4. **Multi-tenant always.** Every business row has `org_id`. Every query is org-scoped via the
   mandatory query helper. Cross-tenant access must be impossible.
5. **No scope creep.** Respect the MVP-0 lock in `docs/02_mvp_scope.md`. Defer the other modules.

## Stack (locked)
Next.js 14 (App Router) + TypeScript (strict) · Tailwind + shadcn/ui · PostgreSQL (Neon) + Drizzle ·
**own JWT + RBAC** (`jose` + `argon2`, httpOnly cookies) · Resend (email) · Cloudflare R2 (storage) ·
React-PDF (PDF) · Anthropic (provider-agnostic AI) · Vercel (deploy, local-first for now).

## Roles
Admin · Manager · Sales Rep · Viewer.

## Design tokens
Primary `#0F172A` · Accent `#2563EB` · Success `#16A34A` · Warning `#F59E0B` · Error `#DC2626`.
Fonts: Inter / IBM Plex Sans. Desktop-first, dashboard-first. No purple gradients/neon/chat layouts.

## Project management
PMI-aligned. GitHub Projects + Issues. Issue prefixes:
`[DOC] [CORE] [AUTH] [DB] [CRM] [QUOTE] [REPORT] [AI] [SEC]`.
Keep these updated: `docs/10_decision_log.md`, `docs/11_discussion_log.md`,
`docs/12_prompt_history.md`, `docs/13_progress_report.md`, `docs/09_risk_register.md`.

## Language
English primary, i18n-ready (message catalog; no hard-coded UI strings).

## Current status
Planning complete. Awaiting owner "start" to begin Sprint 0. See `project-follow/current-session.md`.
