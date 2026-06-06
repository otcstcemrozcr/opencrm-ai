# 06 — Reporting & KPIs

**Last updated:** 2026-06-07
**Rule:** every metric below is a deterministic SQL/Drizzle query in `server/services/*`,
org-scoped. AI never computes or invents these numbers.

## Dashboard KPIs (MVP-0)
| KPI | Definition |
|---|---|
| Open Leads | leads where status ∉ {converted, unqualified} |
| Open Opportunities | opps where stage ∉ {won, lost} |
| Pipeline Value | Σ value of open opportunities |
| Won Revenue | Σ value where stage = won (period-filtered) |
| Lost Revenue | Σ value where stage = lost (period-filtered) |
| Hit Ratio | won / (won + lost) by count |
| Win Rate | won value / (won + lost value) |
| Forecast Revenue | Σ (value × probability) of open opps with expected_close in range |
| Overdue Activities | activities where due_at < now AND completed_at IS NULL |
| Overdue Opportunities | open opps where expected_close < now |

## Forecast (MVP-0 minimal)
Weighted pipeline = Σ(value × probability). Buckets: 30 / 60 / 90 days by `expected_close`.

## Reporting Suite (deferred — documented for later phases)
- **Lead Reports:** Lead Aging, Overdue Leads, Lead Conversion, Source Performance.
- **Opportunity Reports:** Open/Won/Lost, Opportunity Aging, Overdue, Forecast.
- **Sales Reports:** Hit Ratio, Win Rate, Revenue by Salesperson/Team/Industry/Product/Campaign.
- **Quote Reports:** Quotes Created, Accepted, Rejected, Quote Conversion Rate.
- **Forecast:** 30/60/90, Expected Revenue, Weighted Pipeline, Revenue Risk.

## Quality Bar
Salesforce Reports / SAP CX Analytics / Power BI level once the full suite lands. MVP-0 ships only
the Dashboard KPIs above plus per-opportunity insight inputs.
