import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users, organizations } from "@/server/db/schema";
import { getCurrentSession } from "./session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "rep" | "viewer";
  orgId: string;
  orgName: string;
};

/** Resolve the authenticated user + org from the session (org-scoped). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getCurrentSession();
  if (!session) return null;

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      orgId: organizations.id,
      orgName: organizations.name,
    })
    .from(users)
    .innerJoin(organizations, eq(users.orgId, organizations.id))
    .where(eq(users.id, session.sub))
    .limit(1);

  if (!row || row.orgId !== session.orgId) return null;
  return row;
}
