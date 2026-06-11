import "server-only";
import { and, eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/server/db/client";
import { passwordResets, users, sessions } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Find an active user by email (first match across orgs, mirrors login lookup). */
export async function findUserByEmail(email: string) {
  const [row] = await db
    .select({ id: users.id, orgId: users.orgId, isActive: users.isActive })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return row ?? null;
}

export async function createPasswordReset(userId: string, orgId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);
  await db.insert(passwordResets).values({ userId, orgId, token, expiresAt });
  return { token, expiresAt };
}

export async function getResetByToken(token: string) {
  const [row] = await db
    .select({
      id: passwordResets.id,
      userId: passwordResets.userId,
      expiresAt: passwordResets.expiresAt,
      usedAt: passwordResets.usedAt,
    })
    .from(passwordResets)
    .where(eq(passwordResets.token, token))
    .limit(1);
  return row ?? null;
}

export type ResetResult = { ok: true } | { ok: false; error: string };

/** Validate the token, set the new password, consume it, and revoke sessions. */
export async function consumePasswordReset(token: string, newPassword: string): Promise<ResetResult> {
  const reset = await getResetByToken(token);
  if (!reset) return { ok: false, error: "This reset link is invalid." };
  if (reset.usedAt) return { ok: false, error: "This reset link has already been used." };
  if (reset.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "This reset link has expired." };
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, reset.userId));
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.id, reset.id));

  // Invalidate any existing sessions so a leaked password can't keep access.
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, reset.userId)));

  return { ok: true };
}
