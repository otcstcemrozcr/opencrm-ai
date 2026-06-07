import "server-only";
import { cookies } from "next/headers";
import { createHash, randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { sessions } from "@/server/db/schema";
import { signSession, verifySession } from "./jwt";
import { SESSION_COOKIE, SESSION_MAX_AGE_S, type SessionClaims } from "./constants";

function hashSid(sid: string) {
  return createHash("sha256").update(sid).digest("hex");
}

type SessionUser = {
  id: string;
  orgId: string;
  role: SessionClaims["role"];
};

/** Create a server-side session row + signed cookie. */
export async function createSession(user: SessionUser): Promise<void> {
  const sid = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_S * 1000);

  await db.insert(sessions).values({
    userId: user.id,
    orgId: user.orgId,
    refreshTokenHash: hashSid(sid),
    expiresAt,
  });

  const token = await signSession({
    sub: user.id,
    orgId: user.orgId,
    role: user.role,
    sid,
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_S,
  });
}

/** Read + verify the current session from the cookie (JWT only, no DB hit). */
export async function getCurrentSession(): Promise<SessionClaims | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Revoke the server-side session and clear the cookie. */
export async function destroySession(): Promise<void> {
  const claims = await getCurrentSession();
  if (claims?.sid) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.refreshTokenHash, hashSid(claims.sid)));
  }
  cookies().delete(SESSION_COOKIE);
}
