"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { createCampaign, updateCampaign, deleteCampaign } from "@/server/services/campaigns";
import { writeAudit } from "@/server/services/audit";

export type FormState = { error?: string };

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["email", "event", "webinar", "linkedin", "other"]),
  status: z.enum(["planned", "active", "completed"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.coerce.number().min(0).optional(),
  description: z.string().max(2000).optional(),
});

export async function saveCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const id = (formData.get("id") as string) || null;
  const parsed = schema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") || "email",
    status: formData.get("status") || "planned",
    startDate: formData.get("startDate") || undefined,
    endDate: formData.get("endDate") || undefined,
    budget: formData.get("budget") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const input = {
    name: parsed.data.name,
    type: parsed.data.type,
    status: parsed.data.status,
    startDate: parsed.data.startDate || null,
    endDate: parsed.data.endDate || null,
    budget: parsed.data.budget ?? null,
    description: parsed.data.description || null,
    ownerId: user.id,
  };

  let targetId = id;
  if (id) {
    const updated = await updateCampaign(user.orgId, id, input);
    if (!updated) return { error: "Campaign not found." };
  } else {
    const created = await createCampaign(user.orgId, input);
    targetId = created.id;
  }
  revalidatePath("/campaigns");
  redirect(`/campaigns/${targetId}`);
}

export async function removeCampaign(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  await deleteCampaign(user.orgId, id);
  await writeAudit({ orgId: user.orgId, actorId: user.id, action: "delete", entityType: "campaign", entityId: id });
  revalidatePath("/campaigns");
  redirect("/campaigns");
}
