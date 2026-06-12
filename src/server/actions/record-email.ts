"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { draftEmail } from "@/server/ai/email-draft";
import { sendRecordEmail } from "@/server/services/record-email";

const RELATED = ["lead", "opportunity", "account", "contact"] as const;
const ENTITY_PATH: Record<string, string> = {
  lead: "leads",
  opportunity: "opportunities",
  account: "accounts",
  contact: "contacts",
};

export type DraftResult = { subject?: string; body?: string; source?: string; error?: string };

export async function composeDraftAction(formData: FormData): Promise<DraftResult> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const recipientName = ((formData.get("recipientName") as string) || "there").trim();
  const company = ((formData.get("company") as string) || "").trim() || null;
  const purpose = ((formData.get("purpose") as string) || "").trim() || null;

  const draft = await draftEmail({
    recipientName,
    company,
    senderName: user.name,
    orgName: user.orgName,
    purpose,
  });
  return { subject: draft.subject, body: draft.body, source: draft.source };
}

export type SendState = { error?: string; ok?: boolean; delivered?: boolean };

const sendSchema = z.object({
  relatedType: z.enum(RELATED),
  relatedId: z.string().uuid(),
  to: z.string().email("A valid recipient email is required"),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  body: z.string().trim().min(1, "Email body is required").max(10000),
});

export async function sendRecordEmailAction(_prev: SendState, formData: FormData): Promise<SendState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const parsed = sendSchema.safeParse({
    relatedType: formData.get("relatedType"),
    relatedId: formData.get("relatedId"),
    to: formData.get("to"),
    subject: formData.get("subject"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const { delivered } = await sendRecordEmail({
    orgId: user.orgId,
    actorId: user.id,
    relatedType: parsed.data.relatedType,
    relatedId: parsed.data.relatedId,
    to: parsed.data.to,
    subject: parsed.data.subject,
    body: parsed.data.body,
  });

  revalidatePath(`/${ENTITY_PATH[parsed.data.relatedType]}/${parsed.data.relatedId}`);
  return { ok: true, delivered };
}
