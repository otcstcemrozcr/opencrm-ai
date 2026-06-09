"use server";

import { revalidatePath } from "next/cache";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { mergeAccounts, mergeContacts } from "@/server/services/duplicates";
import { writeAudit } from "@/server/services/audit";

export async function mergeAccountsAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const primaryId = formData.get("primary") as string;
  const ids = ((formData.get("ids") as string) || "").split(",").filter(Boolean);
  if (!primaryId || ids.length < 2) return;
  await mergeAccounts(user.orgId, primaryId, ids);
  await writeAudit({ orgId: user.orgId, actorId: user.id, action: "update", entityType: "account", entityId: primaryId, detail: { merged: ids.filter((i) => i !== primaryId) } });
  revalidatePath("/duplicates");
  revalidatePath("/accounts");
}

export async function mergeContactsAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!canWrite(user.role)) throw new Error("FORBIDDEN");
  const primaryId = formData.get("primary") as string;
  const ids = ((formData.get("ids") as string) || "").split(",").filter(Boolean);
  if (!primaryId || ids.length < 2) return;
  await mergeContacts(user.orgId, primaryId, ids);
  await writeAudit({ orgId: user.orgId, actorId: user.id, action: "update", entityType: "contact", entityId: primaryId, detail: { merged: ids.filter((i) => i !== primaryId) } });
  revalidatePath("/duplicates");
  revalidatePath("/contacts");
}
