import type { SessionClaims } from "./constants";

export type Role = SessionClaims["role"];

// Higher number = more privilege.
const RANK: Record<Role, number> = {
  viewer: 0,
  rep: 1,
  manager: 2,
  admin: 3,
};

export function hasRole(role: Role, atLeast: Role): boolean {
  return RANK[role] >= RANK[atLeast];
}

export function assertRole(claims: SessionClaims | null, atLeast: Role): SessionClaims {
  if (!claims) throw new Error("UNAUTHENTICATED");
  if (!hasRole(claims.role, atLeast)) throw new Error("FORBIDDEN");
  return claims;
}
