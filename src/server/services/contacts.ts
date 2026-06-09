import "server-only";
import { and, eq, desc, asc, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { contacts, accounts } from "@/server/db/schema";

export type ContactFilters = { q?: string; sort?: string };

export type ContactInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  title?: string | null;
  accountId?: string | null;
  ownerId?: string | null;
};

export async function listContacts(orgId: string, filters: ContactFilters = {}) {
  const conds: SQL[] = [eq(contacts.orgId, orgId)];
  if (filters.q) {
    const like = `%${filters.q}%`;
    conds.push(or(ilike(contacts.name, like), ilike(contacts.email, like))!);
  }
  const orderBy =
    filters.sort === "name_asc" ? asc(contacts.name) : desc(contacts.createdAt);

  return db
    .select({
      id: contacts.id,
      name: contacts.name,
      email: contacts.email,
      phone: contacts.phone,
      title: contacts.title,
      accountId: contacts.accountId,
      accountName: accounts.name,
    })
    .from(contacts)
    .leftJoin(accounts, eq(contacts.accountId, accounts.id))
    .where(and(...conds))
    .orderBy(orderBy);
}

export async function listContactsByAccount(orgId: string, accountId: string) {
  return db
    .select()
    .from(contacts)
    .where(and(eq(contacts.orgId, orgId), eq(contacts.accountId, accountId)))
    .orderBy(desc(contacts.createdAt));
}

export async function getContact(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(contacts)
    .where(and(eq(contacts.orgId, orgId), eq(contacts.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createContact(orgId: string, input: ContactInput) {
  const [row] = await db
    .insert(contacts)
    .values({
      orgId,
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      linkedin: input.linkedin || null,
      title: input.title || null,
      accountId: input.accountId || null,
      ownerId: input.ownerId || null,
    })
    .returning();
  return row;
}

export async function updateContact(orgId: string, id: string, input: ContactInput) {
  const [row] = await db
    .update(contacts)
    .set({
      name: input.name,
      email: input.email || null,
      phone: input.phone || null,
      linkedin: input.linkedin || null,
      title: input.title || null,
      accountId: input.accountId || null,
      ownerId: input.ownerId || null,
      updatedAt: new Date(),
    })
    .where(and(eq(contacts.orgId, orgId), eq(contacts.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteContact(orgId: string, id: string) {
  await db.delete(contacts).where(and(eq(contacts.orgId, orgId), eq(contacts.id, id)));
}
