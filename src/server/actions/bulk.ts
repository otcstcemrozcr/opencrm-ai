"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { db } from "@/server/db/client";
import { leads, opportunities, accounts, contacts } from "@/server/db/schema";
import { writeAudit } from "@/server/services/audit";

export type BulkEntity = "lead" | "opportunity" | "account" | "contact";

const TABLES = {
  lead: leads,
  opportunity: opportunities,
  account: accounts,
  contact: contacts,
} as const;

function tableFor(entity: BulkEntity) {
  const t = TABLES[entity];
  if (!t) throw new Error("Unknown entity");
  return t;
}

export async function bulkDelete(entity: BulkEntity, ids: string[]): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  if (ids.length === 0) return;
  const t = tableFor(entity);
  await db.delete(t).where(and(eq(t.orgId, user.orgId), inArray(t.id, ids)));
  await writeAudit({
    orgId: user.orgId,
    actorId: user.id,
    action: "delete",
    entityType: entity,
    detail: { bulk: true, count: ids.length, ids },
  });
  revalidatePath(`/${entity}s`);
}

export async function bulkAssignOwner(
  entity: BulkEntity,
  ids: string[],
  ownerId: string
): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  if (ids.length === 0) return;
  const t = tableFor(entity);
  const owner = ownerId === "" ? null : ownerId;
  await db
    .update(t)
    .set({ ownerId: owner, updatedAt: new Date() })
    .where(and(eq(t.orgId, user.orgId), inArray(t.id, ids)));
  await writeAudit({
    orgId: user.orgId,
    actorId: user.id,
    action: "update",
    entityType: entity,
    detail: { bulk: true, count: ids.length, ownerId: owner, ids },
  });
  revalidatePath(`/${entity}s`);
}
