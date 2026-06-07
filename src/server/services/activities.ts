import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities,
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
