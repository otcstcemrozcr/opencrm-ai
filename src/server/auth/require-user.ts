import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "./current-user";
import { hasRole, type Role } from "./rbac";

/**
 * Resolve the authenticated user for server components / server actions.
 * Redirects to sign-in if unauthenticated. This is the single entry point
 * that yields the org_id every data query must be scoped by.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Like requireUser, but also enforces a minimum role. */
export async function requireRole(atLeast: Role): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasRole(user.role, atLeast)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

/** Can this role write (create/edit/delete)? Viewers are read-only. */
export function canWrite(role: Role): boolean {
  return hasRole(role, "rep");
}
