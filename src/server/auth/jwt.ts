import { SignJWT, jwtVerify } from "jose";
import { SESSION_MAX_AGE_S, type SessionClaims } from "./constants";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Copy .env.example to .env.local and fill it in.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ orgId: claims.orgId, role: claims.role, sid: claims.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_S}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.orgId || !payload.role || !payload.sid) return null;
    return {
      sub: payload.sub as string,
      orgId: payload.orgId as string,
      role: payload.role as SessionClaims["role"],
      sid: payload.sid as string,
    };
  } catch {
    return null;
  }
}
