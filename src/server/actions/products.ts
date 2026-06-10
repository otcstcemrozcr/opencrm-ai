"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { createProduct, updateProduct, deleteProduct } from "@/server/services/products";
import { writeAudit } from "@/server/services/audit";

export type FormState = { error?: string };

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sku: z.string().max(80).optional(),
  kind: z.enum(["product", "service"]),
  unitPrice: z.coerce.number().min(0),
  currency: z.string().min(1).max(8),
  taxRate: z.coerce.number().min(0).max(100),
  description: z.string().max(2000).optional(),
  active: z.coerce.boolean().optional(),
});

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const id = (formData.get("id") as string) || null;
  const parsed = schema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku") || undefined,
    kind: formData.get("kind") || "product",
    unitPrice: formData.get("unitPrice") || 0,
    currency: formData.get("currency") || "USD",
    taxRate: formData.get("taxRate") || 0,
    description: formData.get("description") || undefined,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const input = {
    name: parsed.data.name,
    sku: parsed.data.sku || null,
    kind: parsed.data.kind,
    unitPrice: parsed.data.unitPrice,
    currency: parsed.data.currency,
    taxRate: parsed.data.taxRate,
    description: parsed.data.description || null,
    active: parsed.data.active ?? false,
  };

  let targetId = id;
  if (id) {
    const updated = await updateProduct(user.orgId, id, input);
    if (!updated) return { error: "Product not found." };
  } else {
    const created = await createProduct(user.orgId, input);
    targetId = created.id;
  }
  revalidatePath("/products");
  redirect(`/products/${targetId}`);
}

export async function removeProduct(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  await deleteProduct(user.orgId, id);
  await writeAudit({ orgId: user.orgId, actorId: user.id, action: "delete", entityType: "product", entityId: id });
  revalidatePath("/products");
  redirect("/products");
}
