import "server-only";
import { and, eq, lt, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { leads, opportunities, activities } from "@/server/db/schema";

export type DashboardKpis = {
  openLeads: number;
  openOpportunities: number;
  pipelineValue: number;
  wonRevenue: number;
  lostRevenue: number;
  hitRatio: number | null; // won / (won + lost) by count, 0..1
  winRate: number | null; // won value / (won + lost value), 0..1
  forecastRevenue: number; // Σ value * probability/100 of open opps
  overdueOpportunities: number;
  overdueActivities: number;
};

const num = (v: unknown) => Number(v ?? 0);

/**
 * All dashboard numbers are deterministic SQL aggregations, org-scoped.
 * AI never computes these — it only interprets them (docs/06, docs/07).
 */
export async function getDashboardKpis(orgId: string): Promise<DashboardKpis> {
  const now = new Date();

  const [leadAgg] = await db
    .select({
      open: sql<number>`count(*) filter (where ${leads.status} not in ('converted','unqualified'))`,
    })
    .from(leads)
    .where(eq(leads.orgId, orgId));

  const [oppAgg] = await db
    .select({
      open: sql<number>`count(*) filter (where ${opportunities.stage} not in ('won','lost'))`,
      pipeline: sql<string>`coalesce(sum(${opportunities.value}) filter (where ${opportunities.stage} not in ('won','lost')), 0)`,
      forecast: sql<string>`coalesce(sum(${opportunities.value} * ${opportunities.probability} / 100.0) filter (where ${opportunities.stage} not in ('won','lost')), 0)`,
      wonValue: sql<string>`coalesce(sum(${opportunities.value}) filter (where ${opportunities.stage} = 'won'), 0)`,
      lostValue: sql<string>`coalesce(sum(${opportunities.value}) filter (where ${opportunities.stage} = 'lost'), 0)`,
      wonCount: sql<number>`count(*) filter (where ${opportunities.stage} = 'won')`,
      lostCount: sql<number>`count(*) filter (where ${opportunities.stage} = 'lost')`,
      overdue: sql<number>`count(*) filter (where ${opportunities.stage} not in ('won','lost') and ${opportunities.expectedClose} < now())`,
    })
    .from(opportunities)
    .where(eq(opportunities.orgId, orgId));

  const [actAgg] = await db
    .select({ overdue: sql<number>`count(*)` })
    .from(activities)
    .where(
      and(
        eq(activities.orgId, orgId),
        isNull(activities.completedAt),
        lt(activities.dueAt, now)
      )
    );

  const wonCount = num(oppAgg?.wonCount);
  const lostCount = num(oppAgg?.lostCount);
  const wonValue = num(oppAgg?.wonValue);
  const lostValue = num(oppAgg?.lostValue);
  const closedCount = wonCount + lostCount;
  const closedValue = wonValue + lostValue;

  return {
    openLeads: num(leadAgg?.open),
    openOpportunities: num(oppAgg?.open),
    pipelineValue: num(oppAgg?.pipeline),
    wonRevenue: wonValue,
    lostRevenue: lostValue,
    hitRatio: closedCount > 0 ? wonCount / closedCount : null,
    winRate: closedValue > 0 ? wonValue / closedValue : null,
    forecastRevenue: num(oppAgg?.forecast),
    overdueOpportunities: num(oppAgg?.overdue),
    overdueActivities: num(actAgg?.overdue),
  };
}

export async function getOverdueOpportunities(orgId: string, limit = 8) {
  return db
    .select({
      id: opportunities.id,
      name: opportunities.name,
      stage: opportunities.stage,
      value: opportunities.value,
      expectedClose: opportunities.expectedClose,
    })
    .from(opportunities)
    .where(
      and(
        eq(opportunities.orgId, orgId),
        ne(opportunities.stage, "won"),
        ne(opportunities.stage, "lost"),
        lt(opportunities.expectedClose, sql`now()`)
      )
    )
    .orderBy(opportunities.expectedClose)
    .limit(limit);
}

export async function getOverdueActivities(orgId: string, limit = 8) {
  return db
    .select({
      id: activities.id,
      subject: activities.subject,
      type: activities.type,
      dueAt: activities.dueAt,
      relatedType: activities.relatedType,
      relatedId: activities.relatedId,
    })
    .from(activities)
    .where(
      and(
        eq(activities.orgId, orgId),
        isNull(activities.completedAt),
        lt(activities.dueAt, sql`now()`)
      )
    )
    .orderBy(activities.dueAt)
    .limit(limit);
}
