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
import { writeAudit } from "@/server/services/audit";

export type FormState = { error?: string };

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["prospect", "customer", "partner", "other"]),
  industry: z.string().max(120).optional(),
  website: z.string().max(200).optional(),
  phone: z.string().max(60).optional(),
  employees: z.coerce.number().int().min(0).optional(),
  annualRevenue: z.coerce.number().min(0).optional(),
  addressLine: z.string().max(200).optional(),
  city: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
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
    type: formData.get("type") || "prospect",
    industry: formData.get("industry") || undefined,
    website: formData.get("website") || undefined,
    phone: formData.get("phone") || undefined,
    employees: formData.get("employees") || undefined,
    annualRevenue: formData.get("annualRevenue") || undefined,
    addressLine: formData.get("addressLine") || undefined,
    city: formData.get("city") || undefined,
    country: formData.get("country") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = {
    name: parsed.data.name,
    type: parsed.data.type,
    industry: parsed.data.industry ?? null,
    website: parsed.data.website ?? null,
    phone: parsed.data.phone ?? null,
    employees: parsed.data.employees ?? null,
    annualRevenue: parsed.data.annualRevenue ?? null,
    addressLine: parsed.data.addressLine ?? null,
    city: parsed.data.city ?? null,
    country: parsed.data.country ?? null,
    description: parsed.data.description ?? null,
  };

  let targetId = id;
  if (id) {
    const updated = await updateAccount(user.orgId, id, input);
    if (!updated) return { error: "Account not found." };
  } else {
    const created = await createAccount(user.orgId, input);
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
  await writeAudit({ orgId: user.orgId, actorId: user.id, action: "delete", entityType: "account", entityId: id });
  revalidatePath("/accounts");
  redirect("/accounts");
}
