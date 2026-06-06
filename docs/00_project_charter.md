# 00 — Project Charter

**Project:** OpenCRM AI
**Type:** AI-native Revenue Operations (RevOps) platform
**Status:** Planning (pre-build)
**Last updated:** 2026-06-07

## 1. Purpose
OpenCRM AI is a Revenue Operations platform for SMB and mid-sized companies. It is the
**Revenue Engine** that gives complete visibility over the sales lifecycle. It is **not** a
lead-generation tool and **not** an AI chatbot. Prospecting tools (Apollo, LeadMesh, LinkedIn
Sales Navigator) are treated as data sources only.

## 2. Business Objectives
Within 60 seconds, a user should understand:
- What is overdue
- What is at risk
- Which opportunities need attention
- Which campaigns generate revenue
- Which salespeople perform best
- Expected revenue for next month

## 3. Scope (high level)
Full sales lifecycle: Campaign → Lead → Qualified Lead → Opportunity → Appointment → Quote →
Negotiation → Won/Lost → Customer. See `02_mvp_scope.md` for the ruthless MVP-0 cut.

## 4. Out of Scope (MVP-0)
Campaigns, full Reporting suite, Activities calendar, Administration depth, Apollo/LeadMesh import,
Word export, ERP integrations, Communication Hub (Email/WhatsApp/Telegram/Teams/SMS).

## 5. Stakeholders & Roles
The build is driven by a single owner acting through an AI engineering partner that simultaneously
plays Product Owner, Solution Architect, Senior Engineer, and Technical PM.
Application roles: Admin / Manager / Sales Rep / Viewer.

## 6. Success Criteria (MVP-0)
The revenue loop works end-to-end: a Lead can be converted to an Account+Contact+Opportunity,
moved through the pipeline, quoted (with PDF), and reflected on the Dashboard with a grounded AI
insight — all under strict multi-tenant isolation.

## 7. Governance
PMI principles. GitHub Projects + Issues. Human approval required before commit / push / deploy /
send. AI never invents numbers. See `07_ai_principles.md` and `CLAUDE.md`.
