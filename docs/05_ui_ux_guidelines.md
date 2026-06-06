# 05 — UI / UX Guidelines

**Last updated:** 2026-06-07

## Design Tokens
| Token | Value | Use |
|---|---|---|
| Primary | `#0F172A` | nav, headings, primary text |
| Accent | `#2563EB` | primary actions, links, active states |
| Success | `#16A34A` | won, positive deltas |
| Warning | `#F59E0B` | at-risk, due-soon |
| Error | `#DC2626` | lost, overdue, destructive |

Fonts: **Inter** (UI) / **IBM Plex Sans** (alt). Desktop-first. Generous data density.

## Layout
- **Left nav** (modules) · **top bar** (org switcher, search, user) · content area.
- Dashboard: top KPI cards → charts → overdue lists.
- Record pages: **split-screen** (record detail left, timeline/activities right).
- Lists: large tables, sticky header, column sorting, powerful filters, **saved views**.
- Pipeline: **Kanban** (drag between stages) + list + forecast toggle.

## Component System
shadcn/ui as the base. Build shared CRM primitives in `components/crm/`: DataTable, KpiCard,
StageBadge, OwnerAvatar, FilterBar, RecordHeader, Timeline, InsightCallout.

## AI Presentation Rules
- AI insights appear as a **subtle inline callout** on records/dashboards — never a chat window.
- One short prose line + structured fields (risk level, recommended action).
- Numbers shown are always the deterministic ones; AI text references them, never generates them.

## Interaction Principles
- Minimal clicks; primary action always visible on a record.
- Optimistic UI for Kanban drag, with server reconciliation.
- Keyboard-friendly tables and command palette (post-MVP-0).

## Forbidden
Chatbot-first layouts · purple gradients · neon · futuristic AI styling · large persistent chat
windows · copying Salesforce/SAP/Dynamics branding, colors, or icons.

## Accessibility & i18n
WCAG AA contrast on tokens. All strings via message catalog (English default), i18n-ready.
