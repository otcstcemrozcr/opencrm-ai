import "server-only";
import { db } from "@/server/db/client";
import { auditLogs } from "@/server/db/schema";

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
