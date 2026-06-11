import "server-only";
import { and, eq, desc, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/server/db/client";
import { invitations, organizations, users, type UserRole } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";

const INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createInvitation(
  orgId: string,
  input: { email: string; role: UserRole; invitedByUserId: string }
) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  const [row] = await db
    .insert(invitations)
    .values({
      orgId,
      email: input.email,
      role: input.role,
      token,
      invitedByUserId: input.invitedByUserId,
      expiresAt,
    })
    .returning();
  return row;
}

/** Pending (not yet accepted) invitations for the org's admin screen. */
export async function listPendingInvitations(orgId: string) {
  return db
    .select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      token: invitations.token,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
    })
    .from(invitations)
    .where(and(eq(invitations.orgId, orgId), isNull(invitations.acceptedAt)))
    .orderBy(desc(invitations.createdAt));
}

/** Look up an invitation by token, joined with its org (for the accept page). */
export async function getInvitationByToken(token: string) {
  const [row] = await db
    .select({
      id: invitations.id,
      orgId: invitations.orgId,
      email: invitations.email,
      role: invitations.role,
      expiresAt: invitations.expiresAt,
      acceptedAt: invitations.acceptedAt,
      orgName: organizations.name,
    })
    .from(invitations)
    .innerJoin(organizations, eq(invitations.orgId, organizations.id))
    .where(eq(invitations.token, token))
    .limit(1);
  return row ?? null;
}

export async function hasPendingInvite(orgId: string, email: string) {
  const [row] = await db
    .select({ id: invitations.id })
    .from(invitations)
    .where(
      and(
        eq(invitations.orgId, orgId),
        eq(invitations.email, email),
        isNull(invitations.acceptedAt)
      )
    )
    .limit(1);
  return Boolean(row);
}

export async function revokeInvitation(orgId: string, id: string) {
  await db
    .delete(invitations)
    .where(and(eq(invitations.orgId, orgId), eq(invitations.id, id)));
}

export type AcceptResult =
  | { ok: true; userId: string; orgId: string; role: UserRole }
  | { ok: false; error: string };

/** Accept an invitation: create the user, mark the invite consumed. */
export async function acceptInvitation(
  token: string,
  input: { name: string; password: string }
): Promise<AcceptResult> {
  const invite = await getInvitationByToken(token);
  if (!invite) return { ok: false, error: "This invitation link is invalid." };
  if (invite.acceptedAt) return { ok: false, error: "This invitation has already been used." };
  if (invite.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This invitation has expired." };
  }

  // Guard against an account already existing for this email in the org.
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.orgId, invite.orgId), eq(users.email, invite.email)))
    .limit(1);
  if (existing) return { ok: false, error: "An account already exists for this email." };

  const passwordHash = await hashPassword(input.password);
  const [created] = await db
    .insert(users)
    .values({
      orgId: invite.orgId,
      email: invite.email,
      name: input.name,
      role: invite.role,
      passwordHash,
      emailVerified: true,
    })
    .returning({ id: users.id });

  await db
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.id, invite.id));

  return { ok: true, userId: created.id, orgId: invite.orgId, role: invite.role };
}
