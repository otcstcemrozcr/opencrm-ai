import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/server/db/client";
import { notes, users, type ActivityRelatedType } from "@/server/db/schema";

export async function listNotes(
  orgId: string,
  relatedType: ActivityRelatedType,
  relatedId: string
) {
  return db
    .select({
      id: notes.id,
      body: notes.body,
      authorId: notes.authorId,
      authorName: users.name,
      createdAt: notes.createdAt,
    })
    .from(notes)
    .leftJoin(users, eq(notes.authorId, users.id))
    .where(
      and(
        eq(notes.orgId, orgId),
        eq(notes.relatedType, relatedType),
        eq(notes.relatedId, relatedId)
      )
    )
    .orderBy(desc(notes.createdAt));
}

export async function createNote(
  orgId: string,
  authorId: string,
  relatedType: ActivityRelatedType,
  relatedId: string,
  body: string
) {
  const [row] = await db
    .insert(notes)
    .values({ orgId, authorId, relatedType, relatedId, body })
    .returning();
  return row;
}

export async function deleteNote(orgId: string, id: string) {
  await db.delete(notes).where(and(eq(notes.orgId, orgId), eq(notes.id, id)));
}
