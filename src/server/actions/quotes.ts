"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import {
  createQuote,
  updateQuote,
  deleteQuote,
  setQuoteStatus,
  createQuoteVersion,
  type QuoteLineInput,
} from "@/server/services/quotes";
import { writeAudit } from "@/server/services/audit";

export type FormState = { error?: string };

const lineSchema = z.object({
  kind: z.enum(["product", "service"]),
  name: z.string().min(1, "Line name is required").max(200),
  description: z.string().max(500).optional().nullable(),
  qty: z.coerce.number().min(0),
  unitPrice: z.coerce.number().min(0),
  discount: z.coerce.number().min(0),
  taxRate: z.coerce.number().min(0).max(100),
});

const schema = z.object({
  accountId: z.string().uuid().optional().or(z.literal("")),
  opportunityId: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
  currency: z.string().min(1).max(8),
  notes: z.string().max(2000).optional(),
  validUntil: z.string().optional(),
  lines: z.array(lineSchema).min(1, "Add at least one line item"),
});

export async function saveQuote(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const id = (formData.get("id") as string) || null;
  let lines: unknown;
  try {
    lines = JSON.parse((formData.get("lines") as string) || "[]");
  } catch {
    return { error: "Invalid line items." };
  }

  const parsed = schema.safeParse({
    accountId: formData.get("accountId") || "",
    opportunityId: formData.get("opportunityId") || "",
    status: formData.get("status") || "draft",
    currency: formData.get("currency") || "USD",
    notes: formData.get("notes") || undefined,
    validUntil: formData.get("validUntil") || undefined,
    lines,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = {
    accountId: parsed.data.accountId || null,
    opportunityId: parsed.data.opportunityId || null,
    status: parsed.data.status,
    currency: parsed.data.currency,
    notes: parsed.data.notes || null,
    validUntil: parsed.data.validUntil || null,
  };
  const lineInputs: QuoteLineInput[] = parsed.data.lines.map((l) => ({
    kind: l.kind,
    name: l.name,
    description: l.description ?? null,
    qty: l.qty,
    unitPrice: l.unitPrice,
    discount: l.discount,
    taxRate: l.taxRate,
  }));

  let targetId = id;
  if (id) {
    const updated = await updateQuote(user.orgId, id, input, lineInputs);
    if (!updated) return { error: "Quote not found." };
  } else {
    const created = await createQuote(user.orgId, input, lineInputs);
    targetId = created.id;
  }

  revalidatePath("/quotes");
  redirect(`/quotes/${targetId}`);
}

export async function removeQuote(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  await deleteQuote(user.orgId, id);
  await writeAudit({ orgId: user.orgId, actorId: user.id, action: "delete", entityType: "quote", entityId: id });
  revalidatePath("/quotes");
  redirect("/quotes");
}

export async function newQuoteVersion(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  const newId = await createQuoteVersion(user.orgId, id);
  revalidatePath("/quotes");
  if (newId) redirect(`/quotes/${newId}/edit`);
  redirect(`/quotes/${id}`);
}

export async function changeQuoteStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  const status = formData.get("status") as
    | "draft"
    | "sent"
    | "accepted"
    | "rejected"
    | "expired";
  await setQuoteStatus(user.orgId, id, status);
  await writeAudit({ orgId: user.orgId, actorId: user.id, action: "status", entityType: "quote", entityId: id, detail: { status } });
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
}
