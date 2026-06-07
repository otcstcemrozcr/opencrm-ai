import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/server/db/client";
import { accounts } from "@/server/db/schema";

export type AccountInput = {
  name: string;
  industry?: string | null;
  website?: string | null;
  ownerId?: string | null;
};

export async function listAccounts(orgId: string) {
  return db
    .select()
    .from(accounts)
    .where(eq(accounts.orgId, orgId))
    .orderBy(desc(accounts.createdAt));
}

export async function getAccount(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.orgId, orgId), eq(accounts.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createAccount(orgId: string, input: AccountInput) {
  const [row] = await db
    .insert(accounts)
    .values({
      orgId,
      name: input.name,
      industry: input.industry || null,
      website: input.website || null,
      ownerId: input.ownerId || null,
    })
    .returning();
  return row;
}

export async function updateAccount(orgId: string, id: string, input: AccountInput) {
  const [row] = await db
    .update(accounts)
    .set({
      name: input.name,
      industry: input.industry || null,
      website: input.website || null,
      ownerId: input.ownerId || null,
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.orgId, orgId), eq(accounts.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteAccount(orgId: string, id: string) {
  await db.delete(accounts).where(and(eq(accounts.orgId, orgId), eq(accounts.id, id)));
}
