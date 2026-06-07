import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/server/db/client";
import { opportunities, accounts, type OpportunityStage } from "@/server/db/schema";

export type OpportunityInput = {
  name: string;
  accountId?: string | null;
  stage?: OpportunityStage;
  value?: string | number;
  probability?: number;
  expectedClose?: string | null;
  ownerId?: string | null;
};

export async function listOpportunities(orgId: string) {
  return db
    .select({
      id: opportunities.id,
      name: opportunities.name,
      stage: opportunities.stage,
      value: opportunities.value,
      probability: opportunities.probability,
      expectedClose: opportunities.expectedClose,
      accountId: opportunities.accountId,
      accountName: accounts.name,
    })
    .from(opportunities)
    .leftJoin(accounts, eq(opportunities.accountId, accounts.id))
    .where(eq(opportunities.orgId, orgId))
    .orderBy(desc(opportunities.createdAt));
}

export async function getOpportunity(orgId: string, id: string) {
  const [row] = await db
    .select({
      id: opportunities.id,
      name: opportunities.name,
      stage: opportunities.stage,
      value: opportunities.value,
      probability: opportunities.probability,
      expectedClose: opportunities.expectedClose,
      competitor: opportunities.competitor,
      notes: opportunities.notes,
      accountId: opportunities.accountId,
      accountName: accounts.name,
    })
    .from(opportunities)
    .leftJoin(accounts, eq(opportunities.accountId, accounts.id))
    .where(and(eq(opportunities.orgId, orgId), eq(opportunities.id, id)))
    .limit(1);
  return row ?? null;
}

export async function listOpportunitiesByAccount(orgId: string, accountId: string) {
  return db
    .select()
    .from(opportunities)
    .where(and(eq(opportunities.orgId, orgId), eq(opportunities.accountId, accountId)))
    .orderBy(desc(opportunities.createdAt));
}

export async function createOpportunity(orgId: string, input: OpportunityInput) {
  const [row] = await db
    .insert(opportunities)
    .values({
      orgId,
      name: input.name,
      accountId: input.accountId || null,
      stage: input.stage ?? "new",
      value: String(input.value ?? "0"),
      probability: input.probability ?? 0,
      expectedClose: input.expectedClose || null,
      ownerId: input.ownerId || null,
    })
    .returning();
  return row;
}
