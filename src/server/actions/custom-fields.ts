"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole, requireUser, canWrite } from "@/server/auth/require-user";
import {
  createFieldDef,
  updateFieldDef,
  deleteFieldDef,
  getFieldDef,
  keyTaken,
  saveRecordValues,
} from "@/server/services/custom-fields";
import { writeAudit } from "@/server/services/audit";

export type FormState = { error?: string; ok?: boolean };

const ENTITY_VALUES = ["account", "contact", "lead", "opportunity"] as const;
type Entity = (typeof ENTITY_VALUES)[number];

const defSchema = z.object({
  entity: z.enum(ENTITY_VALUES),
  label: z.string().trim().min(1, "Label is required").max(100),
  key: z
    .string()
    .trim()
    .max(50)
    .regex(/^[a-z0-9_]*$/, "Key may use lowercase letters, numbers and underscores only.")
    .optional(),
  type: z.enum(["text", "number", "date", "select", "checkbox"]),
  options: z.string().optional(),
  required: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  active: z.boolean().optional(),
});

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

export async function saveFieldDef(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireRole("admin");
  const id = (formData.get("id") as string) || null;

  const parsed = defSchema.safeParse({
    entity: formData.get("entity"),
    label: formData.get("label"),
    key: (formData.get("key") as string) || undefined,
    type: formData.get("type") || "text",
    options: (formData.get("options") as string) || undefined,
    required: formData.get("required") === "on",
    sortOrder: formData.get("sortOrder") || undefined,
    active: formData.get("active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const key = (parsed.data.key && parsed.data.key.length > 0)
    ? parsed.data.key
    : slugify(parsed.data.label);
  if (!key) return { error: "Could not derive a key from the label; set one explicitly." };

  const options =
    parsed.data.type === "select"
      ? (parsed.data.options ?? "")
          .split("\n")
          .map((o) => o.trim())
          .filter(Boolean)
      : null;
  if (parsed.data.type === "select" && (!options || options.length === 0)) {
    return { error: "Add at least one option for a select field." };
  }

  if (await keyTaken(me.orgId, parsed.data.entity, key, id ?? undefined)) {
    return { error: `Key "${key}" is already used for ${parsed.data.entity}.` };
  }

  const input = {
    entity: parsed.data.entity,
    key,
    label: parsed.data.label,
    type: parsed.data.type,
    options,
    required: parsed.data.required ?? false,
    sortOrder: parsed.data.sortOrder ?? 0,
    active: parsed.data.active ?? true,
  };

  if (id) {
    const updated = await updateFieldDef(me.orgId, id, input);
    if (!updated) return { error: "Field not found." };
    await writeAudit({
      orgId: me.orgId, actorId: me.id, action: "update",
      entityType: "custom_field_def", entityId: id,
      detail: { entity: input.entity, key, label: input.label },
    });
  } else {
    const created = await createFieldDef(me.orgId, input);
    await writeAudit({
      orgId: me.orgId, actorId: me.id, action: "create",
      entityType: "custom_field_def", entityId: created?.id,
      detail: { entity: input.entity, key, label: input.label },
    });
  }

  revalidatePath("/settings/custom-fields");
  redirect("/settings/custom-fields");
}

export async function removeFieldDef(formData: FormData): Promise<void> {
  const me = await requireRole("admin");
  const id = formData.get("id") as string;
  const def = await getFieldDef(me.orgId, id);
  await deleteFieldDef(me.orgId, id);
  await writeAudit({
    orgId: me.orgId, actorId: me.id, action: "delete",
    entityType: "custom_field_def", entityId: id,
    detail: def ? { entity: def.entity, key: def.key } : undefined,
  });
  revalidatePath("/settings/custom-fields");
  redirect("/settings/custom-fields");
}

const ENTITY_PATH: Record<string, string> = {
  account: "accounts",
  contact: "contacts",
  lead: "leads",
  opportunity: "opportunities",
};

export async function saveRecordCustomFields(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireUser();
  if (!canWrite(me.role)) return { error: "You do not have permission to do this." };

  const entity = formData.get("entity") as string;
  const recordId = formData.get("recordId") as string;
  if (!(ENTITY_VALUES as readonly string[]).includes(entity) || !recordId) {
    return { error: "Invalid request." };
  }

  // Field inputs are named cf_<fieldId>.
  const values: Record<string, string> = {};
  for (const [name, val] of formData.entries()) {
    if (name.startsWith("cf_")) values[name.slice(3)] = typeof val === "string" ? val : "";
  }

  await saveRecordValues(me.orgId, entity as Entity, recordId, values);
  await writeAudit({
    orgId: me.orgId, actorId: me.id, action: "update",
    entityType: entity, entityId: recordId, detail: { customFields: Object.keys(values).length },
  });

  revalidatePath(`/${ENTITY_PATH[entity]}/${recordId}`);
  return { ok: true };
}
