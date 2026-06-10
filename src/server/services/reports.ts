import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { opportunities, leads, accounts, users } from "@/server/db/schema";

const n = (v: unknown) => Number(v ?? 0);

/** Open pipeline grouped by stage: count + total value. */
export async function pipelineByStage(orgId: string) {
  const rows = await db
    .select({
      stage: opportunities.stage,
      count: sql<number>`count(*)`,
      value: sql<string>`coalesce(sum(${opportunities.value}), 0)`,
    })
    .from(opportunities)
    .where(
      and(
        eq(opportunities.orgId, orgId),
        sql`${opportunities.stage} not in ('won','lost')`
      )
    )
    .groupBy(opportunities.stage);
  return rows.map((r) => ({ stage: r.stage, count: n(r.count), value: n(r.value) }));
}

/** Won revenue grouped by owner (salesperson). */
export async function revenueByOwner(orgId: string) {
  const rows = await db
    .select({
      name: sql<string>`coalesce(${users.name}, 'Unassigned')`,
      value: sql<string>`coalesce(sum(${opportunities.value}), 0)`,
    })
    .from(opportunities)
    .leftJoin(users, eq(opportunities.ownerId, users.id))
    .where(and(eq(opportunities.orgId, orgId), eq(opportunities.stage, "won")))
    .groupBy(sql`coalesce(${users.name}, 'Unassigned')`);
  return rows.map((r) => ({ name: r.name, value: n(r.value) })).filter((r) => r.value > 0);
}

/** Won revenue grouped by account industry. */
export async function revenueByIndustry(orgId: string) {
  const rows = await db
    .select({
      name: sql<string>`coalesce(${accounts.industry}, 'Unknown')`,
      value: sql<string>`coalesce(sum(${opportunities.value}), 0)`,
    })
    .from(opportunities)
    .leftJoin(accounts, eq(opportunities.accountId, accounts.id))
    .where(and(eq(opportunities.orgId, orgId), eq(opportunities.stage, "won")))
    .groupBy(sql`coalesce(${accounts.industry}, 'Unknown')`);
  return rows.map((r) => ({ name: r.name, value: n(r.value) })).filter((r) => r.value > 0);
}

/** Lead counts grouped by status. */
export async function leadsByStatus(orgId: string) {
  const rows = await db
    .select({ status: leads.status, count: sql<number>`count(*)` })
    .from(leads)
    .where(eq(leads.orgId, orgId))
    .groupBy(leads.status);
  return rows.map((r) => ({ name: r.status, count: n(r.count) }));
}

/** Weighted forecast in 30/60/90 day buckets (open opps with a close date). */
export async function forecastBuckets(orgId: string) {
  const [r] = await db
    .select({
      d30: sql<string>`coalesce(sum(${opportunities.value} * ${opportunities.probability} / 100.0) filter (where ${opportunities.expectedClose} >= now() and ${opportunities.expectedClose} < now() + interval '30 days'), 0)`,
      d60: sql<string>`coalesce(sum(${opportunities.value} * ${opportunities.probability} / 100.0) filter (where ${opportunities.expectedClose} >= now() + interval '30 days' and ${opportunities.expectedClose} < now() + interval '60 days'), 0)`,
      d90: sql<string>`coalesce(sum(${opportunities.value} * ${opportunities.probability} / 100.0) filter (where ${opportunities.expectedClose} >= now() + interval '60 days' and ${opportunities.expectedClose} < now() + interval '90 days'), 0)`,
    })
    .from(opportunities)
    .where(and(eq(opportunities.orgId, orgId), sql`${opportunities.stage} not in ('won','lost')`));
  return { d30: n(r?.d30), d60: n(r?.d60), d90: n(r?.d90) };
}
