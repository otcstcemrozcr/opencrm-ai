"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import {
  createOpportunity,
  updateOpportunity,
  updateOpportunityStage,
  deleteOpportunity,
} from "@/server/services/opportunities";
import { writeAudit } from "@/server/services/audit";
import type { OpportunityStage } from "@/server/db/schema";

export type FormState = { error?: string };

const STAGES = [
  "new",
  "qualified",
  "discovery",
  "meeting",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  accountId: z.string().uuid().optional().or(z.literal("")),
  stage: z.enum(STAGES),
  value: z.coerce.number().min(0).max(1_000_000_000),
  probability: z.coerce.number().int().min(0).max(100),
  expectedClose: z.string().optional().or(z.literal("")),
  competitor: z.string().max(200).optional(),
  notes: z.string().max(5000).optional(),
});

export async function saveOpportunity(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const id = (formData.get("id") as string) || null;
  const parsed = schema.safeParse({
    name: formData.get("name"),
    accountId: formData.get("accountId") || "",
    stage: formData.get("stage") || "new",
    value: formData.get("value") || 0,
    probability: formData.get("probability") || 0,
    expectedClose: formData.get("expectedClose") || "",
    competitor: formData.get("competitor") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = {
    name: parsed.data.name,
    accountId: parsed.data.accountId || null,
    stage: parsed.data.stage,
    value: parsed.data.value,
    probability: parsed.data.probability,
    expectedClose: parsed.data.expectedClose || null,
    competitor: parsed.data.competitor || null,
    notes: parsed.data.notes || null,
  };

  let targetId = id;
  if (id) {
    const updated = await updateOpportunity(user.orgId, id, input);
    if (!updated) return { error: "Opportunity not found." };
  } else {
    const created = await createOpportunity(user.orgId, input);
    targetId = created.id;
  }

  revalidatePath("/opportunities");
  redirect(`/opportunities/${targetId}`);
}

export async function removeOpportunity(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  await deleteOpportunity(user.orgId, id);
  await writeAudit({ orgId: user.orgId, actorId: user.id, action: "delete", entityType: "opportunity", entityId: id });
  revalidatePath("/opportunities");
  redirect("/opportunities");
}

/** Called from the Kanban board when a card is dropped on a new column. */
export async function moveOpportunityStage(
  id: string,
  stage: OpportunityStage
): Promise<{ ok: boolean }> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { ok: false };
  const updated = await updateOpportunityStage(user.orgId, id, stage);
  revalidatePath("/opportunities");
  return { ok: Boolean(updated) };
}
