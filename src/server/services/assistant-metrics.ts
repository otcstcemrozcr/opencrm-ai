import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { quotes } from "@/server/db/schema";
import { getDashboardKpis, getFocusThisWeek } from "@/server/services/dashboard";
import { formatCurrency } from "@/lib/utils";

const num = (v: unknown) => Number(v ?? 0);
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);

export type MetricsSnapshot = {
  facts: string; // deterministic, human-readable source the AI may phrase
};

async function getQuoteStats(orgId: string) {
  const [agg] = await db
    .select({
      total: sql<number>`count(*)`,
      quotedValue: sql<string>`coalesce(sum(${quotes.total}) filter (where ${quotes.status} <> 'draft'), 0)`,
      acceptedValue: sql<string>`coalesce(sum(${quotes.total}) filter (where ${quotes.status} = 'accepted'), 0)`,
      sentCount: sql<number>`count(*) filter (where ${quotes.status} <> 'draft')`,
      acceptedCount: sql<number>`count(*) filter (where ${quotes.status} = 'accepted')`,
    })
    .from(quotes)
    .where(eq(quotes.orgId, orgId));
  return {
    total: num(agg?.total),
    quotedValue: num(agg?.quotedValue),
    acceptedValue: num(agg?.acceptedValue),
    sentCount: num(agg?.sentCount),
    acceptedCount: num(agg?.acceptedCount),
  };
}

/**
 * Build a deterministic snapshot of org metrics. Every number here comes from
 * SQL — the assistant may only phrase these, never invent (docs/07).
 */
export async function getMetricsSnapshot(orgId: string): Promise<MetricsSnapshot> {
  const [kpis, focus, q] = await Promise.all([
    getDashboardKpis(orgId),
    getFocusThisWeek(orgId),
    getQuoteStats(orgId),
  ]);

  const hitPct = kpis.hitRatio === null ? null : Math.round(kpis.hitRatio * 100);
  const winPct = kpis.winRate === null ? null : Math.round(kpis.winRate * 100);
  const quoteAcceptByValue = pct(q.acceptedValue, q.quotedValue);
  const quoteAcceptByCount = pct(q.acceptedCount, q.sentCount);

  const lines = [
    `Open leads: ${kpis.openLeads}.`,
    `Open opportunities: ${kpis.openOpportunities}.`,
    `Pipeline value: ${formatCurrency(kpis.pipelineValue)}.`,
    `Weighted forecast: ${formatCurrency(kpis.forecastRevenue)}.`,
    `Won revenue: ${formatCurrency(kpis.wonRevenue)}; lost revenue: ${formatCurrency(kpis.lostRevenue)}.`,
    `Hit ratio (won/closed by count): ${hitPct === null ? "n/a" : hitPct + "%"}.`,
    `Win rate (won/closed by value): ${winPct === null ? "n/a" : winPct + "%"}.`,
    `Overdue opportunities: ${kpis.overdueOpportunities}.`,
    `Overdue activities: ${kpis.overdueActivities}.`,
    `Activities due this week: ${focus.dueThisWeek}.`,
    `Opportunities expected to close this week: ${focus.closingThisWeek} (${formatCurrency(focus.closingThisWeekValue)}).`,
    `Stale open deals (no activity 21+ days): ${focus.staleDeals}.`,
    `Hot leads (score ≥ 70): ${focus.hotLeads}.`,
    `Quotes: ${q.total} total, ${q.sentCount} sent/decided.`,
    `Total quoted value (non-draft): ${formatCurrency(q.quotedValue)}.`,
    `Accepted quote value: ${formatCurrency(q.acceptedValue)}.`,
    `Quote acceptance rate by value: ${quoteAcceptByValue === null ? "n/a" : quoteAcceptByValue + "%"}; by count: ${quoteAcceptByCount === null ? "n/a" : quoteAcceptByCount + "%"}.`,
  ];

  return { facts: lines.join("\n") };
}
