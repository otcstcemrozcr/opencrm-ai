"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import {
  createContact,
  updateContact,
  deleteContact,
} from "@/server/services/contacts";

export type FormState = { error?: string };

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").max(200).optional().or(z.literal("")),
  phone: z.string().max(60).optional(),
  linkedin: z.string().max(200).optional(),
  title: z.string().max(120).optional(),
  accountId: z.string().uuid().optional().or(z.literal("")),
});

export async function saveContact(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const id = (formData.get("id") as string) || null;
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    linkedin: formData.get("linkedin") || undefined,
    title: formData.get("title") || undefined,
    accountId: formData.get("accountId") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = {
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    linkedin: parsed.data.linkedin || null,
    title: parsed.data.title || null,
    accountId: parsed.data.accountId || null,
  };

  let targetId = id;
  if (id) {
    const updated = await updateContact(user.orgId, id, input);
    if (!updated) return { error: "Contact not found." };
  } else {
    const created = await createContact(user.orgId, input);
    targetId = created.id;
  }

  revalidatePath("/contacts");
  redirect(`/contacts/${targetId}`);
}

export async function removeContact(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  await deleteContact(user.orgId, id);
  revalidatePath("/contacts");
  redirect("/contacts");
}
