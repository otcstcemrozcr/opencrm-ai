import "server-only";
import { eq, desc } from "drizzle-orm";
import { db } from "@/server/db/client";
import { auditLogs, users } from "@/server/db/schema";

type AuditEntry = {
  orgId: string;
  actorId: string;
  action: "create" | "update" | "delete" | "convert" | "status";
  entityType: string;
  entityId?: string | null;
  detail?: Record<string, unknown>;
};

/** Best-effort audit write. Never throws into the calling action. */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      orgId: entry.orgId,
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      diff: entry.detail ? JSON.stringify(entry.detail) : null,
    });
  } catch {
    // swallow — auditing must not break the user action
  }
}

export async function listAuditLogs(orgId: string, limit = 200) {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      diff: auditLogs.diff,
      createdAt: auditLogs.createdAt,
      actorName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .where(eq(auditLogs.orgId, orgId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
