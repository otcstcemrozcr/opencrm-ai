"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { createActivity, completeActivity } from "@/server/services/activities";

export type FormState = { error?: string; ok?: boolean };

const schema = z.object({
  type: z.enum(["call", "meeting", "demo", "site_visit", "follow_up"]),
  subject: z.string().min(1, "Subject is required").max(200),
  notes: z.string().max(2000).optional(),
  dueAt: z.string().optional().or(z.literal("")),
  relatedType: z.enum(["lead", "opportunity", "account", "contact"]),
  relatedId: z.string().uuid(),
});

export async function addActivity(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const parsed = schema.safeParse({
    type: formData.get("type") || "follow_up",
    subject: formData.get("subject"),
    notes: formData.get("notes") || undefined,
    dueAt: formData.get("dueAt") || "",
    relatedType: formData.get("relatedType"),
    relatedId: formData.get("relatedId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createActivity(user.orgId, {
    type: parsed.data.type,
    subject: parsed.data.subject,
    notes: parsed.data.notes || null,
    dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    relatedType: parsed.data.relatedType,
    relatedId: parsed.data.relatedId,
    ownerId: user.id,
  });

  revalidatePath(`/${parsed.data.relatedType}s/${parsed.data.relatedId}`);
  return { ok: true };
}

export async function completeActivityAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  const path = formData.get("path") as string;
  await completeActivity(user.orgId, id);
  if (path) revalidatePath(path);
}
