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
  name2: z.string().max(200).optional(),
  type: z.enum(["prospect", "customer", "partner", "other"]),
  industry: z.string().max(120).optional(),
  website: z.string().max(200).optional(),
  phone: z.string().max(60).optional(),
  employees: z.coerce.number().int().min(0).optional(),
  annualRevenue: z.coerce.number().min(0).optional(),
  taxNumber: z.string().max(60).optional(),
  taxOffice: z.string().max(120).optional(),
  currency: z.string().max(8).optional(),
  paymentTerms: z.string().max(120).optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  rating: z.enum(["hot", "warm", "cold"]).optional().or(z.literal("")),
  parentAccountId: z.string().uuid().optional().or(z.literal("")),
  addressLine: z.string().max(200).optional(),
  street2: z.string().max(200).optional(),
  postalCode: z.string().max(40).optional(),
  city: z.string().max(120).optional(),
  region: z.string().max(120).optional(),
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
    name2: formData.get("name2") || undefined,
    type: formData.get("type") || "prospect",
    industry: formData.get("industry") || undefined,
    website: formData.get("website") || undefined,
    phone: formData.get("phone") || undefined,
    employees: formData.get("employees") || undefined,
    annualRevenue: formData.get("annualRevenue") || undefined,
    taxNumber: formData.get("taxNumber") || undefined,
    taxOffice: formData.get("taxOffice") || undefined,
    currency: formData.get("currency") || undefined,
    paymentTerms: formData.get("paymentTerms") || undefined,
    creditLimit: formData.get("creditLimit") || undefined,
    status: formData.get("status") || undefined,
    rating: formData.get("rating") || "",
    parentAccountId: formData.get("parentAccountId") || "",
    addressLine: formData.get("addressLine") || undefined,
    street2: formData.get("street2") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    city: formData.get("city") || undefined,
    region: formData.get("region") || undefined,
    country: formData.get("country") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = {
    name: parsed.data.name,
    name2: parsed.data.name2 ?? null,
    type: parsed.data.type,
    industry: parsed.data.industry ?? null,
    website: parsed.data.website ?? null,
    phone: parsed.data.phone ?? null,
    employees: parsed.data.employees ?? null,
    annualRevenue: parsed.data.annualRevenue ?? null,
    taxNumber: parsed.data.taxNumber ?? null,
    taxOffice: parsed.data.taxOffice ?? null,
    currency: parsed.data.currency || "USD",
    paymentTerms: parsed.data.paymentTerms ?? null,
    creditLimit: parsed.data.creditLimit ?? null,
    status: parsed.data.status ?? "active",
    rating: (parsed.data.rating || null) as "hot" | "warm" | "cold" | null,
    parentAccountId: parsed.data.parentAccountId || null,
    addressLine: parsed.data.addressLine ?? null,
    street2: parsed.data.street2 ?? null,
    postalCode: parsed.data.postalCode ?? null,
    city: parsed.data.city ?? null,
    region: parsed.data.region ?? null,
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
