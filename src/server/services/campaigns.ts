import "server-only";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaigns, leads, opportunities, type CampaignType, type CampaignStatus } from "@/server/db/schema";

export type CampaignInput = {
  name: string;
  type?: CampaignType;
  status?: CampaignStatus;
  startDate?: string | null;
  endDate?: string | null;
  budget?: number | null;
  description?: string | null;
  ownerId?: string | null;
};

function values(input: CampaignInput) {
  return {
    name: input.name,
    type: input.type ?? "email",
    status: input.status ?? "planned",
    startDate: input.startDate || null,
    endDate: input.endDate || null,
    budget:
      input.budget === null || input.budget === undefined ? null : String(input.budget),
    description: input.description || null,
    ownerId: input.ownerId || null,
  };
}

export async function listCampaigns(orgId: string) {
  return db.select().from(campaigns).where(eq(campaigns.orgId, orgId)).orderBy(desc(campaigns.createdAt));
}

export async function getCampaign(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.orgId, orgId), eq(campaigns.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createCampaign(orgId: string, input: CampaignInput) {
  const [row] = await db.insert(campaigns).values({ orgId, ...values(input) }).returning();
  return row;
}

export async function updateCampaign(orgId: string, id: string, input: CampaignInput) {
  const [row] = await db
    .update(campaigns)
    .set({ ...values(input), updatedAt: new Date() })
    .where(and(eq(campaigns.orgId, orgId), eq(campaigns.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteCampaign(orgId: string, id: string) {
  await db.delete(campaigns).where(and(eq(campaigns.orgId, orgId), eq(campaigns.id, id)));
}

export type CampaignMetrics = {
  leads: number;
  converted: number;
  wonRevenue: number;
  roi: number | null; // wonRevenue / budget
};

/** Deterministic ROI: leads attributed to the campaign, conversions, and won
 *  revenue from their converted opportunities. */
export async function getCampaignMetrics(
  orgId: string,
  campaignId: string,
  budget: string | null
): Promise<CampaignMetrics> {
  const [leadAgg] = await db
    .select({
      total: sql<number>`count(*)`,
      converted: sql<number>`count(*) filter (where ${leads.status} = 'converted')`,
    })
    .from(leads)
    .where(and(eq(leads.orgId, orgId), eq(leads.campaignId, campaignId)));

  const [revAgg] = await db
    .select({
      won: sql<string>`coalesce(sum(${opportunities.value}) filter (where ${opportunities.stage} = 'won'), 0)`,
    })
    .from(leads)
    .innerJoin(opportunities, eq(leads.convertedOpportunityId, opportunities.id))
    .where(and(eq(leads.orgId, orgId), eq(leads.campaignId, campaignId)));

  const wonRevenue = Number(revAgg?.won ?? 0);
  const budgetNum = budget ? Number(budget) : 0;
  return {
    leads: Number(leadAgg?.total ?? 0),
    converted: Number(leadAgg?.converted ?? 0),
    wonRevenue,
    roi: budgetNum > 0 ? wonRevenue / budgetNum : null,
  };
}
