import "server-only";
import { and, eq, asc } from "drizzle-orm";
import { db } from "@/server/db/client";
import { savedViews } from "@/server/db/schema";

export async function listSavedViews(orgId: string, userId: string, entity: string) {
  return db
    .select()
    .from(savedViews)
    .where(
      and(
        eq(savedViews.orgId, orgId),
        eq(savedViews.userId, userId),
        eq(savedViews.entity, entity)
      )
    )
    .orderBy(asc(savedViews.name));
}

export async function createSavedView(
  orgId: string,
  userId: string,
  entity: string,
  name: string,
  query: string
) {
  const [row] = await db
    .insert(savedViews)
    .values({ orgId, userId, entity, name, query })
    .returning();
  return row;
}

export async function deleteSavedView(orgId: string, userId: string, id: string) {
  await db
    .delete(savedViews)
    .where(
      and(eq(savedViews.orgId, orgId), eq(savedViews.userId, userId), eq(savedViews.id, id))
    );
}
