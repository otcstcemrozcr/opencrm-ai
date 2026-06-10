"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/require-user";
import { updateOrganization } from "@/server/services/organization";
import { writeAudit } from "@/server/services/audit";
import { CURRENCIES, TIMEZONES } from "@/config/org-settings";

export type FormState = { error?: string; ok?: boolean };

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .url("Enter a valid URL (including https://).")
  .optional()
  .or(z.literal(""));

const schema = z.object({
  name: z.string().trim().min(1, "Organization name is required").max(200),
  legalName: z.string().trim().max(200).optional(),
  defaultCurrency: z.enum(CURRENCIES),
  timezone: z.enum(TIMEZONES),
  logoUrl: optionalUrl,
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color like #2563EB.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(50).optional(),
  website: optionalUrl,
  address: z.string().trim().max(500).optional(),
  taxNumber: z.string().trim().max(100).optional(),
});

export async function saveOrganization(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireRole("admin");

  const parsed = schema.safeParse({
    name: formData.get("name"),
    legalName: formData.get("legalName") || undefined,
    defaultCurrency: formData.get("defaultCurrency") || "USD",
    timezone: formData.get("timezone") || "UTC",
    logoUrl: formData.get("logoUrl") || "",
    primaryColor: formData.get("primaryColor") || "",
    phone: formData.get("phone") || undefined,
    website: formData.get("website") || "",
    address: formData.get("address") || undefined,
    taxNumber: formData.get("taxNumber") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const updated = await updateOrganization(me.orgId, {
    name: parsed.data.name,
    legalName: parsed.data.legalName || null,
    defaultCurrency: parsed.data.defaultCurrency,
    timezone: parsed.data.timezone,
    logoUrl: parsed.data.logoUrl || null,
    primaryColor: parsed.data.primaryColor || null,
    phone: parsed.data.phone || null,
    website: parsed.data.website || null,
    address: parsed.data.address || null,
    taxNumber: parsed.data.taxNumber || null,
  });
  if (!updated) return { error: "Organization not found." };

  await writeAudit({
    orgId: me.orgId,
    actorId: me.id,
    action: "update",
    entityType: "organization",
    entityId: me.orgId,
    detail: { name: parsed.data.name, defaultCurrency: parsed.data.defaultCurrency, timezone: parsed.data.timezone },
  });

  revalidatePath("/settings/organization");
  return { ok: true };
}
