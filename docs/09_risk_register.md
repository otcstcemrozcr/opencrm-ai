# 09 — Risk Register

**Last updated:** 2026-06-07
Scale: Likelihood (L) / Impact (I) — Low / Med / High.

| # | Risk | L | I | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Tenant data leak (org_id omitted in a query) | Med | Critical | Mandatory org-scoped query helper; cross-tenant tests; code review | Architect |
| R2 | AI invents numbers | Med | High | AI consumes pre-computed metrics only; grounded prompts; output validation vs dataset | AI lead |
| R3 | Scope creep (pull toward all 11 modules) | High | High | MVP-0 lock; phase discipline; backlog gating | PO |
| R4 | PDF export fragile on serverless | Low | Med | React-PDF (pure JS), avoid headless Chrome | Engineer |
| R5 | (Retired) Clerk↔org sync — N/A, own auth chosen | — | — | Closed | — |
| R6 | Own auth = larger security surface | Med | High | Proven libs (`jose`, `argon2`), httpOnly cookies, login rate-limit, password reset token hashing | Engineer |
| R7 | i18n retrofit cost if strings hard-coded | Med | Med | Message catalog from day 1; lint against literals | Engineer |
| R8 | Forecast/KPI definitions drift | Low | Med | Single source in `06_reporting_kpis.md`; services match doc | PO |
| R9 | Local→Vercel/Neon deploy surprises | Med | Med | Keep env parity; deploy early once MVP-0 stabilizes; preview URLs | Engineer |

## Notes
- R1 and R6 are the two that block "done" — both must have tests before MVP-0 sign-off.
