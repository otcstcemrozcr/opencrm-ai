import "server-only";
import { and, eq, asc, sql, ne } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users, type UserRole } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";

export type UserInput = {
  name: string;
  email: string;
  role: UserRole;
  password?: string | null;
};

/** Owner picklist + general listing (id, name, role). Kept lightweight. */
export async function listOrgUsers(orgId: string) {
  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.orgId, orgId))
    .orderBy(asc(users.name));
}

/** Full admin listing for the user-management screen. */
export async function listUsersForAdmin(orgId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.orgId, orgId))
    .orderBy(asc(users.name));
}

export async function getUser(orgId: string, id: string) {
  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.orgId, orgId), eq(users.id, id)))
    .limit(1);
  return row ?? null;
}

/** True when another user in the org already uses this email. */
export async function emailTaken(orgId: string, email: string, exceptId?: string) {
  const conds = [eq(users.orgId, orgId), eq(users.email, email)];
  if (exceptId) conds.push(ne(users.id, exceptId));
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(...conds))
    .limit(1);
  return Boolean(row);
}

/** Count of active admins in the org — used to protect the last admin. */
export async function countActiveAdmins(orgId: string, exceptId?: string): Promise<number> {
  const conds = [
    eq(users.orgId, orgId),
    eq(users.role, "admin"),
    eq(users.isActive, true),
  ];
  if (exceptId) conds.push(ne(users.id, exceptId));
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(users)
    .where(and(...conds));
  return Number(row?.n ?? 0);
}

export async function createUser(orgId: string, input: UserInput) {
  const passwordHash = await hashPassword(input.password ?? "");
  const [row] = await db
    .insert(users)
    .values({
      orgId,
      name: input.name,
      email: input.email,
      role: input.role,
      passwordHash,
    })
    .returning({ id: users.id });
  return row;
}

/** Update profile fields. Password is only changed when a value is supplied. */
export async function updateUser(orgId: string, id: string, input: UserInput) {
  const set: Record<string, unknown> = {
    name: input.name,
    email: input.email,
    role: input.role,
    updatedAt: new Date(),
  };
  if (input.password) set.passwordHash = await hashPassword(input.password);

  const [row] = await db
    .update(users)
    .set(set)
    .where(and(eq(users.orgId, orgId), eq(users.id, id)))
    .returning({ id: users.id });
  return row ?? null;
}

export async function setUserActive(orgId: string, id: string, isActive: boolean) {
  const [row] = await db
    .update(users)
    .set({ isActive, updatedAt: new Date() })
    .where(and(eq(users.orgId, orgId), eq(users.id, id)))
    .returning({ id: users.id });
  return row ?? null;
}
