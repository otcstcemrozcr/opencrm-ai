"use server";

import { revalidatePath } from "next/cache";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { createAccount } from "@/server/services/accounts";
import { createContact } from "@/server/services/contacts";
import { createLead } from "@/server/services/leads";
import { writeAudit } from "@/server/services/audit";
import type { ImportEntity } from "@/config/import-fields";
import type { LeadStatus } from "@/server/db/schema";
import type { AccountType } from "@/server/db/schema";

type Row = Record<string, string>;

const ACCOUNT_TYPES = ["prospect", "customer", "partner", "other"];
const LEAD_STATUSES = ["new", "working", "qualified", "unqualified", "converted"];

export async function importRecords(
  entity: ImportEntity,
  rows: Row[]
): Promise<{ imported: number; skipped: number; error?: string }> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { imported: 0, skipped: 0, error: "Not permitted." };
  if (!Array.isArray(rows) || rows.length === 0) return { imported: 0, skipped: 0, error: "Nothing to import." };
  if (rows.length > 1000) return { imported: 0, skipped: 0, error: "Max 1000 rows per import." };

  let imported = 0;
  let skipped = 0;

  for (const r of rows) {
    try {
      if (entity === "account") {
        if (!r.name?.trim()) { skipped++; continue; }
        const type = ACCOUNT_TYPES.includes(r.type) ? (r.type as AccountType) : "prospect";
        await createAccount(user.orgId, {
          name: r.name.trim(),
          type,
          industry: r.industry || null,
          website: r.website || null,
          phone: r.phone || null,
          city: r.city || null,
          country: r.country || null,
          ownerId: user.id,
        });
        imported++;
      } else if (entity === "contact") {
        if (!r.name?.trim()) { skipped++; continue; }
        await createContact(user.orgId, {
          name: r.name.trim(),
          email: r.email || null,
          phone: r.phone || null,
          title: r.title || null,
          ownerId: user.id,
        });
        imported++;
      } else {
        if (!r.company?.trim()) { skipped++; continue; }
        const status = LEAD_STATUSES.includes(r.status) ? (r.status as LeadStatus) : "new";
        const score = Math.max(0, Math.min(100, parseInt(r.score, 10) || 0));
        await createLead(user.orgId, {
          company: r.company.trim(),
          contactName: r.contactName || null,
          email: r.email || null,
          phone: r.phone || null,
          source: r.source || null,
          industry: r.industry || null,
          status,
          score,
          ownerId: user.id,
        });
        imported++;
      }
    } catch {
      skipped++;
    }
  }

  await writeAudit({
    orgId: user.orgId,
    actorId: user.id,
    action: "create",
    entityType: entity,
    detail: { import: true, imported, skipped },
  });
  revalidatePath(`/${entity}s`);
  return { imported, skipped };
}
