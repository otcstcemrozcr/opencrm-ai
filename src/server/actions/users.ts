"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/server/auth/require-user";
import {
  createUser,
  updateUser,
  setUserActive,
  getUser,
  emailTaken,
  countActiveAdmins,
} from "@/server/services/users";
import { writeAudit } from "@/server/services/audit";

export type FormState = { error?: string };

const ROLES = ["admin", "manager", "rep", "viewer"] as const;

const baseSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("A valid email is required").max(320),
  role: z.enum(ROLES),
});

export async function saveUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireRole("admin");

  const id = (formData.get("id") as string) || null;
  const passwordRaw = ((formData.get("password") as string) || "").trim();

  const parsed = baseSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role") || "rep",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const email = parsed.data.email.toLowerCase();

  // New users must get a password; edits keep the old one unless a new one is given.
  if (!id && passwordRaw.length < 8) {
    return { error: "Set an initial password of at least 8 characters." };
  }
  if (passwordRaw && passwordRaw.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (await emailTaken(me.orgId, email, id ?? undefined)) {
    return { error: "Another user already uses this email." };
  }

  const input = {
    name: parsed.data.name,
    email,
    role: parsed.data.role,
    password: passwordRaw || null,
  };

  if (id) {
    const target = await getUser(me.orgId, id);
    if (!target) return { error: "User not found." };

    // Don't let the org lose its last active admin via a demotion.
    if (target.role === "admin" && target.isActive && parsed.data.role !== "admin") {
      const others = await countActiveAdmins(me.orgId, id);
      if (others === 0) {
        return { error: "You can't change the role of the last active admin." };
      }
    }

    const updated = await updateUser(me.orgId, id, input);
    if (!updated) return { error: "User not found." };
    await writeAudit({
      orgId: me.orgId,
      actorId: me.id,
      action: "update",
      entityType: "user",
      entityId: id,
      detail: { name: input.name, email, role: input.role, passwordChanged: Boolean(passwordRaw) },
    });
  } else {
    const created = await createUser(me.orgId, input);
    await writeAudit({
      orgId: me.orgId,
      actorId: me.id,
      action: "create",
      entityType: "user",
      entityId: created?.id,
      detail: { name: input.name, email, role: input.role },
    });
  }

  revalidatePath("/settings/users");
  redirect("/settings/users");
}

export async function setUserActiveAction(formData: FormData): Promise<void> {
  const me = await requireRole("admin");
  const id = formData.get("id") as string;
  const activate = formData.get("activate") === "true";

  const target = await getUser(me.orgId, id);
  if (!target) throw new Error("NOT_FOUND");

  if (!activate) {
    if (id === me.id) throw new Error("You can't deactivate your own account.");
    if (target.role === "admin" && target.isActive) {
      const others = await countActiveAdmins(me.orgId, id);
      if (others === 0) throw new Error("You can't deactivate the last active admin.");
    }
  }

  await setUserActive(me.orgId, id, activate);
  await writeAudit({
    orgId: me.orgId,
    actorId: me.id,
    action: "status",
    entityType: "user",
    entityId: id,
    detail: { isActive: activate },
  });
  revalidatePath("/settings/users");
}
