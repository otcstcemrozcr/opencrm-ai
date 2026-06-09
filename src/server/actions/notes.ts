"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { createNote, deleteNote } from "@/server/services/notes";

export type FormState = { error?: string; ok?: boolean };

const schema = z.object({
  body: z.string().min(1, "Note cannot be empty").max(4000),
  relatedType: z.enum(["lead", "opportunity", "account", "contact"]),
  relatedId: z.string().uuid(),
});

export async function addNote(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const parsed = schema.safeParse({
    body: formData.get("body"),
    relatedType: formData.get("relatedType"),
    relatedId: formData.get("relatedId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await createNote(
    user.orgId,
    user.id,
    parsed.data.relatedType,
    parsed.data.relatedId,
    parsed.data.body
  );

  revalidatePath(`/${parsed.data.relatedType}s/${parsed.data.relatedId}`);
  return { ok: true };
}

export async function deleteNoteAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  const path = formData.get("path") as string;
  await deleteNote(user.orgId, id);
  if (path) revalidatePath(path);
}
