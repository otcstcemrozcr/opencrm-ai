"use server";

import { revalidatePath } from "next/cache";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { enrichLead, enrichContact, type ApplyResult } from "@/server/services/apollo-enrich";
import { recomputeLeadScore } from "@/server/services/lead-score";
import { writeAudit } from "@/server/services/audit";

export type EnrichState = { message?: string; error?: string };

function describe(result: ApplyResult): EnrichState {
  if (!result.configured) return { error: "Apollo isn't configured (set APOLLO_API_KEY)." };
  if (!result.found) return { error: "No Apollo match found for this record." };
  if (result.filled.length === 0) return { message: "Match found — all fields were already filled." };
  return { message: `Enriched: ${result.filled.join(", ")}.` };
}

export async function enrichRecordAction(formData: FormData): Promise<EnrichState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const entity = formData.get("entity") as string;
  const id = formData.get("id") as string;
  if (!id || (entity !== "lead" && entity !== "contact")) return { error: "Invalid request." };

  const result = entity === "lead" ? await enrichLead(user.orgId, id) : await enrichContact(user.orgId, id);

  if (result.configured && result.found && result.filled.length > 0) {
    if (entity === "lead") await recomputeLeadScore(user.orgId, id);
    await writeAudit({
      orgId: user.orgId,
      actorId: user.id,
      action: "update",
      entityType: entity,
      entityId: id,
      detail: { apolloEnriched: result.filled },
    });
    revalidatePath(`/${entity}s/${id}`);
  }

  return describe(result);
}
