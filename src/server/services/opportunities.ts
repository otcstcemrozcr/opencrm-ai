import "server-only";
import { and, eq, desc, asc, ilike, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { opportunities, accounts, type OpportunityStage } from "@/server/db/schema";

export type OpportunityFilters = {
  q?: string;
  stage?: OpportunityStage;
  sort?: string;
};

export type OpportunityInput = {
  name: string;
  accountId?: string | null;
  stage?: OpportunityStage;
  value?: string | number;
  probability?: number;
  expectedClose?: string | null;
  ownerId?: string | null;
};

export async function listOpportunities(orgId: string, filters: OpportunityFilters = {}) {
  const conds: SQL[] = [eq(opportunities.orgId, orgId)];
  if (filters.stage) conds.push(eq(opportunities.stage, filters.stage));
  if (filters.q) conds.push(ilike(opportunities.name, `%${filters.q}%`));

  const orderBy =
    filters.sort === "value_desc"
      ? desc(opportunities.value)
      : filters.sort === "value_asc"
        ? asc(opportunities.value)
        : filters.sort === "close_asc"
          ? asc(opportunities.expectedClose)
          : filters.sort === "name_asc"
            ? asc(opportunities.name)
            : desc(opportunities.createdAt);

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
    .where(and(...conds))
    .orderBy(orderBy);
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

export async function updateOpportunity(
  orgId: string,
  id: string,
  input: OpportunityInput & { competitor?: string | null; notes?: string | null }
) {
  const closing = input.stage === "won" || input.stage === "lost";
  const [row] = await db
    .update(opportunities)
    .set({
      name: input.name,
      accountId: input.accountId || null,
      stage: input.stage ?? "new",
      value: String(input.value ?? "0"),
      probability: input.probability ?? 0,
      expectedClose: input.expectedClose || null,
      competitor: input.competitor || null,
      notes: input.notes || null,
      closedAt: closing ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(opportunities.orgId, orgId), eq(opportunities.id, id)))
    .returning();
  return row ?? null;
}

export async function updateOpportunityStage(
  orgId: string,
  id: string,
  stage: OpportunityStage
) {
  const closing = stage === "won" || stage === "lost";
  const [row] = await db
    .update(opportunities)
    .set({
      stage,
      closedAt: closing ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(opportunities.orgId, orgId), eq(opportunities.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteOpportunity(orgId: string, id: string) {
  await db.delete(opportunities).where(and(eq(opportunities.orgId, orgId), eq(opportunities.id, id)));
}
