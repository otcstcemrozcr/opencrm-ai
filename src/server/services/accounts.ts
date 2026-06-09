import "server-only";
import { and, eq, desc, asc, ilike, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { accounts, type AccountType } from "@/server/db/schema";

export type AccountFilters = { q?: string; type?: AccountType; sort?: string };

export type AccountInput = {
  name: string;
  name2?: string | null;
  type?: AccountType;
  industry?: string | null;
  website?: string | null;
  phone?: string | null;
  employees?: number | null;
  annualRevenue?: number | null;
  taxNumber?: string | null;
  taxOffice?: string | null;
  addressLine?: string | null;
  street2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  description?: string | null;
  ownerId?: string | null;
};

function toValues(input: AccountInput) {
  return {
    name: input.name,
    name2: input.name2 || null,
    type: input.type ?? "prospect",
    industry: input.industry || null,
    website: input.website || null,
    phone: input.phone || null,
    employees: input.employees ?? null,
    annualRevenue:
      input.annualRevenue === null || input.annualRevenue === undefined
        ? null
        : String(input.annualRevenue),
    taxNumber: input.taxNumber || null,
    taxOffice: input.taxOffice || null,
    addressLine: input.addressLine || null,
    street2: input.street2 || null,
    postalCode: input.postalCode || null,
    city: input.city || null,
    region: input.region || null,
    country: input.country || null,
    description: input.description || null,
    ownerId: input.ownerId || null,
  };
}

export async function listAccounts(orgId: string, filters: AccountFilters = {}) {
  const conds: SQL[] = [eq(accounts.orgId, orgId)];
  if (filters.type) conds.push(eq(accounts.type, filters.type));
  if (filters.q) conds.push(ilike(accounts.name, `%${filters.q}%`));

  const orderBy =
    filters.sort === "name_asc"
      ? asc(accounts.name)
      : filters.sort === "created_asc"
        ? asc(accounts.createdAt)
        : desc(accounts.createdAt);

  return db.select().from(accounts).where(and(...conds)).orderBy(orderBy);
}

export async function getAccount(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.orgId, orgId), eq(accounts.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createAccount(orgId: string, input: AccountInput) {
  const [row] = await db
    .insert(accounts)
    .values({ orgId, ...toValues(input) })
    .returning();
  return row;
}

export async function updateAccount(orgId: string, id: string, input: AccountInput) {
  const [row] = await db
    .update(accounts)
    .set({ ...toValues(input), updatedAt: new Date() })
    .where(and(eq(accounts.orgId, orgId), eq(accounts.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteAccount(orgId: string, id: string) {
  await db.delete(accounts).where(and(eq(accounts.orgId, orgId), eq(accounts.id, id)));
}
