import "server-only";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities,
  accounts,
  contacts,
  opportunities,
  leads,
  type ActivityType,
  type ActivityRelatedType,
} from "@/server/db/schema";

export type ActivityInput = {
  type: ActivityType;
  subject: string;
  notes?: string | null;
  dueAt?: Date | null;
  relatedType: ActivityRelatedType;
  relatedId: string;
  ownerId?: string | null;
};

export async function listActivities(
  orgId: string,
  relatedType: ActivityRelatedType,
  relatedId: string
) {
  return db
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.orgId, orgId),
        eq(activities.relatedType, relatedType),
        eq(activities.relatedId, relatedId)
      )
    )
    .orderBy(desc(activities.createdAt));
}

/** Org-wide activity list with the related record's display label. */
export async function listAllActivities(orgId: string) {
  return db
    .select({
      id: activities.id,
      type: activities.type,
      subject: activities.subject,
      notes: activities.notes,
      dueAt: activities.dueAt,
      completedAt: activities.completedAt,
      createdAt: activities.createdAt,
      relatedType: activities.relatedType,
      relatedId: activities.relatedId,
      relatedLabel: sql<string | null>`coalesce(${accounts.name}, ${contacts.name}, ${leads.company}, ${opportunities.name})`,
    })
    .from(activities)
    .leftJoin(
      accounts,
      and(eq(activities.relatedType, "account"), eq(activities.relatedId, accounts.id))
    )
    .leftJoin(
      contacts,
      and(eq(activities.relatedType, "contact"), eq(activities.relatedId, contacts.id))
    )
    .leftJoin(
      leads,
      and(eq(activities.relatedType, "lead"), eq(activities.relatedId, leads.id))
    )
    .leftJoin(
      opportunities,
      and(eq(activities.relatedType, "opportunity"), eq(activities.relatedId, opportunities.id))
    )
    .where(eq(activities.orgId, orgId))
    .orderBy(desc(activities.createdAt));
}

export async function uncompleteActivity(orgId: string, id: string) {
  await db
    .update(activities)
    .set({ completedAt: null, updatedAt: new Date() })
    .where(and(eq(activities.orgId, orgId), eq(activities.id, id)));
}

export async function deleteActivity(orgId: string, id: string) {
  await db.delete(activities).where(and(eq(activities.orgId, orgId), eq(activities.id, id)));
}

export async function createActivity(orgId: string, input: ActivityInput) {
  const [row] = await db
    .insert(activities)
    .values({
      orgId,
      type: input.type,
      subject: input.subject,
      notes: input.notes || null,
      dueAt: input.dueAt || null,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
      ownerId: input.ownerId || null,
    })
    .returning();

  // Keep last_activity_at fresh on the parent record (feeds AI Insight v1).
  const now = new Date();
  if (input.relatedType === "opportunity") {
    await db
      .update(opportunities)
      .set({ lastActivityAt: now })
      .where(and(eq(opportunities.orgId, orgId), eq(opportunities.id, input.relatedId)));
  } else if (input.relatedType === "lead") {
    await db
      .update(leads)
      .set({ lastActivityAt: now })
      .where(and(eq(leads.orgId, orgId), eq(leads.id, input.relatedId)));
  }

  return row;
}

export async function completeActivity(orgId: string, id: string) {
  await db
    .update(activities)
    .set({ completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(activities.orgId, orgId), eq(activities.id, id)));
}
