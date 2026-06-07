"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import {
  createAccount,
  updateAccount,
  deleteAccount,
} from "@/server/services/accounts";

export type FormState = { error?: string };

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  industry: z.string().max(120).optional(),
  website: z.string().max(200).optional(),
});

export async function saveAccount(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const id = (formData.get("id") as string) || null;
  const parsed = schema.safeParse({
    name: formData.get("name"),
    industry: formData.get("industry") || undefined,
    website: formData.get("website") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let targetId = id;
  if (id) {
    const updated = await updateAccount(user.orgId, id, parsed.data);
    if (!updated) return { error: "Account not found." };
  } else {
    const created = await createAccount(user.orgId, parsed.data);
    targetId = created.id;
  }

  revalidatePath("/accounts");
  redirect(`/accounts/${targetId}`);
}

export async function removeAccount(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  await deleteAccount(user.orgId, id);
  revalidatePath("/accounts");
  redirect("/accounts");
}
