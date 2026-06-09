"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/server/auth/require-user";
import { createSavedView, deleteSavedView } from "@/server/services/saved-views";

const ENTITIES = ["lead", "opportunity", "account", "contact"] as const;

const schema = z.object({
  entity: z.enum(ENTITIES),
  name: z.string().min(1).max(80),
  query: z.string().max(500),
});

export async function saveView(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    entity: formData.get("entity"),
    name: (formData.get("name") as string)?.trim(),
    query: formData.get("query") ?? "",
  });
  if (!parsed.success) return;
  await createSavedView(user.orgId, user.id, parsed.data.entity, parsed.data.name, parsed.data.query);
  revalidatePath(`/${parsed.data.entity}s`);
}

export async function removeSavedView(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = formData.get("id") as string;
  const entity = formData.get("entity") as string;
  await deleteSavedView(user.orgId, user.id, id);
  revalidatePath(`/${entity}s`);
}
