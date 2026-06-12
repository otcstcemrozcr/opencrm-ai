"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import {
  createLead,
  updateLead,
  deleteLead,
  convertLead,
} from "@/server/services/leads";
import { recomputeLeadScore } from "@/server/services/lead-score";
import { writeAudit } from "@/server/services/audit";

export type FormState = { error?: string };

const schema = z.object({
  company: z.string().min(1, "Company is required").max(200),
  contactName: z.string().max(200).optional(),
  email: z.string().email("Invalid email").max(200).optional().or(z.literal("")),
  phone: z.string().max(60).optional(),
  linkedin: z.string().max(200).optional(),
  source: z.string().max(120).optional(),
  industry: z.string().max(120).optional(),
  status: z.enum(["new", "working", "qualified", "unqualified", "converted"]),
  score: z.coerce.number().int().min(0).max(100),
  rating: z.enum(["hot", "warm", "cold"]).optional().or(z.literal("")),
  estimatedValue: z.coerce.number().min(0).optional(),
  utmSource: z.string().max(120).optional(),
  utmMedium: z.string().max(120).optional(),
  utmCampaign: z.string().max(120).optional(),
  doNotContact: z.coerce.boolean().optional(),
  campaignId: z.string().uuid().optional().or(z.literal("")),
});

export async function saveLead(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const id = (formData.get("id") as string) || null;
  const parsed = schema.safeParse({
    company: formData.get("company"),
    contactName: formData.get("contactName") || undefined,
    email: formData.get("email") || "",
    phone: formData.get("phone") || undefined,
    linkedin: formData.get("linkedin") || undefined,
    source: formData.get("source") || undefined,
    industry: formData.get("industry") || undefined,
    status: formData.get("status") || "new",
    score: formData.get("score") || 0,
    rating: formData.get("rating") || "",
    estimatedValue: formData.get("estimatedValue") || undefined,
    utmSource: formData.get("utmSource") || undefined,
    utmMedium: formData.get("utmMedium") || undefined,
    utmCampaign: formData.get("utmCampaign") || undefined,
    doNotContact: formData.get("doNotContact") === "on",
    campaignId: formData.get("campaignId") || "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const input = {
    company: parsed.data.company,
    contactName: parsed.data.contactName || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    linkedin: parsed.data.linkedin || null,
    source: parsed.data.source || null,
    industry: parsed.data.industry || null,
    status: parsed.data.status,
    score: parsed.data.score,
    rating: (parsed.data.rating || null) as "hot" | "warm" | "cold" | null,
    estimatedValue: parsed.data.estimatedValue ?? null,
    utmSource: parsed.data.utmSource || null,
    utmMedium: parsed.data.utmMedium || null,
    utmCampaign: parsed.data.utmCampaign || null,
    doNotContact: parsed.data.doNotContact ?? false,
    campaignId: parsed.data.campaignId || null,
  };

  let targetId = id;
  if (id) {
    const updated = await updateLead(user.orgId, id, input);
    if (!updated) return { error: "Lead not found." };
  } else {
    const created = await createLead(user.orgId, input);
    targetId = created.id;
  }

  // Score is computed deterministically from rules — any manual value is overridden.
  if (targetId) await recomputeLeadScore(user.orgId, targetId);

  revalidatePath("/leads");
  redirect(`/leads/${targetId}`);
}

export async function recalcLeadScoreAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  await recomputeLeadScore(user.orgId, id);
  revalidatePath(`/leads/${id}`);
  revalidatePath("/leads");
}

export async function removeLead(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  await deleteLead(user.orgId, id);
  await writeAudit({ orgId: user.orgId, actorId: user.id, action: "delete", entityType: "lead", entityId: id });
  revalidatePath("/leads");
  redirect("/leads");
}

export async function convertLeadAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const id = formData.get("id") as string;
  const result = await convertLead(user.orgId, id, user.id);
  if (!result.ok) {
    // Re-render the lead page; the lead status row will reflect reality.
    redirect(`/leads/${id}?error=${encodeURIComponent(result.error)}`);
  }
  await writeAudit({
    orgId: user.orgId,
    actorId: user.id,
    action: "convert",
    entityType: "lead",
    entityId: id,
    detail: {
      accountId: result.accountId,
      contactId: result.contactId,
      opportunityId: result.opportunityId,
    },
  });
  revalidatePath("/leads");
  revalidatePath("/accounts");
  redirect(`/opportunities/${result.opportunityId}`);
}
