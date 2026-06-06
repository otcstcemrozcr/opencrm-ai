# 01 — Product Vision

**Last updated:** 2026-06-07

## Positioning
OpenCRM AI = the Revenue Engine. Think Salesforce Sales Cloud, SAP Sales Cloud, and Microsoft
Dynamics 365 Sales from a *business* perspective — but with its own identity, a modern UI, and
embedded AI intelligence. Prospecting platforms feed it; they do not replace it.

## Lifecycle
```
Campaign → Lead → Qualified Lead → Opportunity → Appointment → Quote → Negotiation → Won/Lost → Customer
```

## AI Philosophy
AI behaves as a **Revenue Analyst**, never a chatbot. It may summarize, explain, recommend, and
identify risks. It must **never invent numbers** — every metric/KPI comes from deterministic
database queries; AI only interprets results in prose. AI is subtle; the CRM remains the center.

Example outputs:
- "23 opportunities are overdue."
- "No activity detected in the last 17 days. Risk level: Medium. Recommended action: Schedule follow-up."
- "Hit ratio decreased by 8%."

## UX Philosophy (patterns, not branding)
References for **UX patterns only** (do not copy branding/colors/icons): Salesforce, SAP CX,
Dynamics 365. Focus: dashboard-first, information density, large tables, powerful filtering, saved
views, drill-down reports, timeline activities, split-screen layouts, Kanban pipeline, minimal clicks.

## UI Philosophy (visual inspiration)
Linear · Stripe Dashboard · Vercel · Notion · Attio. Style: modern enterprise SaaS, professional,
elegant, clean, dashboard-first, desktop-first. Avoid: chatbot layouts, purple gradients, neon,
futuristic AI styling, large chat windows. AI must never dominate the UI.

## Design Tokens
Primary `#0F172A` · Accent `#2563EB` · Success `#16A34A` · Warning `#F59E0B` · Error `#DC2626`.
Fonts: Inter / IBM Plex Sans. Layout: left nav · top KPI cards · large data tables · clean charts.

## Modules (full vision)
Dashboard · Campaigns · Leads · Accounts · Contacts · Opportunities · Activities · Quotes ·
Reporting · AI Insights · Administration · Communication Hub (future).

## Language
Primary: English. Architecture must be i18n-ready from day 1.
