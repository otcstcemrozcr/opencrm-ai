"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { requireRole } from "@/server/auth/require-user";
import {
  createInvitation,
  revokeInvitation,
  hasPendingInvite,
  acceptInvitation,
} from "@/server/services/invitations";
import { emailTaken } from "@/server/services/users";
import { createSession } from "@/server/auth/session";
import { writeAudit } from "@/server/services/audit";
import { sendEmail } from "@/server/email/send";

export type InviteState = { error?: string; ok?: boolean; link?: string; delivered?: boolean };
export type AcceptState = { error?: string };

function appOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

const inviteSchema = z.object({
  email: z.string().email("A valid email is required").max(320),
  role: z.enum(["admin", "manager", "rep", "viewer"]),
});

export async function inviteUser(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const me = await requireRole("admin");

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") || "rep",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const email = parsed.data.email.toLowerCase();
  if (await emailTaken(me.orgId, email)) {
    return { error: "A user with this email already exists." };
  }
  if (await hasPendingInvite(me.orgId, email)) {
    return { error: "There is already a pending invitation for this email." };
  }

  const invite = await createInvitation(me.orgId, {
    email,
    role: parsed.data.role,
    invitedByUserId: me.id,
  });

  const link = `${appOrigin()}/invite/${invite.token}`;
  const { delivered } = await sendEmail({
    to: email,
    subject: `You're invited to ${me.orgName} on OpenCRM AI`,
    html: `<p>You've been invited to join <strong>${me.orgName}</strong> on OpenCRM AI as a ${parsed.data.role}.</p>
<p><a href="${link}">Accept your invitation</a> (valid for 7 days).</p>
<p>If the link doesn't work, copy this URL:<br>${link}</p>`,
    text: `You've been invited to join ${me.orgName} on OpenCRM AI. Accept here (valid 7 days): ${link}`,
  });

  await writeAudit({
    orgId: me.orgId,
    actorId: me.id,
    action: "create",
    entityType: "invitation",
    entityId: invite.id,
    detail: { email, role: parsed.data.role, delivered },
  });

  revalidatePath("/settings/users");
  return { ok: true, link, delivered };
}

export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const me = await requireRole("admin");
  const id = formData.get("id") as string;
  await revokeInvitation(me.orgId, id);
  await writeAudit({
    orgId: me.orgId,
    actorId: me.id,
    action: "delete",
    entityType: "invitation",
    entityId: id,
  });
  revalidatePath("/settings/users");
}

const acceptSchema = z.object({
  name: z.string().trim().min(1, "Your name is required").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function acceptInvitationAction(_prev: AcceptState, formData: FormData): Promise<AcceptState> {
  const token = formData.get("token") as string;
  const parsed = acceptSchema.safeParse({
    name: formData.get("name"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const result = await acceptInvitation(token, {
    name: parsed.data.name,
    password: parsed.data.password,
  });
  if (!result.ok) return { error: result.error };

  await createSession({ id: result.userId, orgId: result.orgId, role: result.role });
  redirect("/dashboard");
}
