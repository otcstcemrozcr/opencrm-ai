import "server-only";
import { and, eq, asc } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  customFieldDefs,
  customFieldValues,
  type CustomFieldEntity,
  type CustomFieldType,
} from "@/server/db/schema";

export const ENTITIES: CustomFieldEntity[] = ["account", "contact", "lead", "opportunity"];

export type FieldDefInput = {
  entity: CustomFieldEntity;
  key: string;
  label: string;
  type: CustomFieldType;
  options?: string[] | null;
  required?: boolean;
  sortOrder?: number;
  active?: boolean;
};

/** All definitions for the org, optionally scoped to one entity. */
export async function listFieldDefs(orgId: string, entity?: CustomFieldEntity) {
  const where = entity
    ? and(eq(customFieldDefs.orgId, orgId), eq(customFieldDefs.entity, entity))
    : eq(customFieldDefs.orgId, orgId);
  return db
    .select()
    .from(customFieldDefs)
    .where(where)
    .orderBy(asc(customFieldDefs.entity), asc(customFieldDefs.sortOrder), asc(customFieldDefs.label));
}

/** Active definitions for an entity — used when rendering record forms. */
export async function listActiveFieldDefs(orgId: string, entity: CustomFieldEntity) {
  return db
    .select()
    .from(customFieldDefs)
    .where(
      and(
        eq(customFieldDefs.orgId, orgId),
        eq(customFieldDefs.entity, entity),
        eq(customFieldDefs.active, true)
      )
    )
    .orderBy(asc(customFieldDefs.sortOrder), asc(customFieldDefs.label));
}

export async function getFieldDef(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(customFieldDefs)
    .where(and(eq(customFieldDefs.orgId, orgId), eq(customFieldDefs.id, id)))
    .limit(1);
  return row ?? null;
}

export async function keyTaken(
  orgId: string,
  entity: CustomFieldEntity,
  key: string,
  exceptId?: string
) {
  const rows = await db
    .select({ id: customFieldDefs.id })
    .from(customFieldDefs)
    .where(
      and(
        eq(customFieldDefs.orgId, orgId),
        eq(customFieldDefs.entity, entity),
        eq(customFieldDefs.key, key)
      )
    );
  return rows.some((r) => r.id !== exceptId);
}

function defValues(input: FieldDefInput) {
  return {
    entity: input.entity,
    key: input.key,
    label: input.label,
    type: input.type,
    options:
      input.options && input.options.length > 0 ? JSON.stringify(input.options) : null,
    required: input.required ?? false,
    sortOrder: input.sortOrder ?? 0,
    active: input.active ?? true,
  };
}

export async function createFieldDef(orgId: string, input: FieldDefInput) {
  const [row] = await db
    .insert(customFieldDefs)
    .values({ orgId, ...defValues(input) })
    .returning({ id: customFieldDefs.id });
  return row;
}

export async function updateFieldDef(orgId: string, id: string, input: FieldDefInput) {
  const [row] = await db
    .update(customFieldDefs)
    .set({ ...defValues(input), updatedAt: new Date() })
    .where(and(eq(customFieldDefs.orgId, orgId), eq(customFieldDefs.id, id)))
    .returning({ id: customFieldDefs.id });
  return row ?? null;
}

export async function deleteFieldDef(orgId: string, id: string) {
  await db
    .delete(customFieldDefs)
    .where(and(eq(customFieldDefs.orgId, orgId), eq(customFieldDefs.id, id)));
}

export type FieldWithValue = {
  id: string;
  key: string;
  label: string;
  type: CustomFieldType;
  options: string[];
  required: boolean;
  value: string | null;
};

/** Active field definitions for an entity joined with a record's stored values. */
export async function getRecordFields(
  orgId: string,
  entity: CustomFieldEntity,
  recordId: string
): Promise<FieldWithValue[]> {
  const defs = await listActiveFieldDefs(orgId, entity);
  if (defs.length === 0) return [];

  const vals = await db
    .select({ fieldId: customFieldValues.fieldId, value: customFieldValues.value })
    .from(customFieldValues)
    .where(
      and(
        eq(customFieldValues.orgId, orgId),
        eq(customFieldValues.entity, entity),
        eq(customFieldValues.recordId, recordId)
      )
    );
  const byField = new Map(vals.map((v) => [v.fieldId, v.value]));

  return defs.map((d) => ({
    id: d.id,
    key: d.key,
    label: d.label,
    type: d.type,
    options: d.options ? (JSON.parse(d.options) as string[]) : [],
    required: d.required,
    value: byField.get(d.id) ?? null,
  }));
}

/** Upsert a map of fieldId -> value for one record (org-scoped). */
export async function saveRecordValues(
  orgId: string,
  entity: CustomFieldEntity,
  recordId: string,
  values: Record<string, string>
) {
  const defs = await listActiveFieldDefs(orgId, entity);
  const validIds = new Set(defs.map((d) => d.id));

  for (const [fieldId, raw] of Object.entries(values)) {
    if (!validIds.has(fieldId)) continue; // ignore unknown/foreign field ids
    const value = raw.trim();

    if (value === "") {
      await db
        .delete(customFieldValues)
        .where(
          and(
            eq(customFieldValues.orgId, orgId),
            eq(customFieldValues.fieldId, fieldId),
            eq(customFieldValues.recordId, recordId)
          )
        );
      continue;
    }

    await db
      .insert(customFieldValues)
      .values({ orgId, fieldId, entity, recordId, value })
      .onConflictDoUpdate({
        target: [customFieldValues.fieldId, customFieldValues.recordId],
        set: { value, updatedAt: new Date() },
      });
  }
}
