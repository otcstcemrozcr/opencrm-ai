import "server-only";
import { and, eq, desc, asc, ilike, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { products, type QuoteLineKind } from "@/server/db/schema";

export type ProductFilters = { q?: string; active?: string; sort?: string };

export type ProductInput = {
  name: string;
  sku?: string | null;
  kind?: QuoteLineKind;
  unitPrice?: number;
  currency?: string;
  taxRate?: number;
  description?: string | null;
  active?: boolean;
};

function values(input: ProductInput) {
  return {
    name: input.name,
    sku: input.sku || null,
    kind: input.kind ?? "product",
    unitPrice: String(input.unitPrice ?? 0),
    currency: input.currency || "USD",
    taxRate: String(input.taxRate ?? 0),
    description: input.description || null,
    active: input.active ?? true,
  };
}

export async function listProducts(orgId: string, filters: ProductFilters = {}) {
  const conds: SQL[] = [eq(products.orgId, orgId)];
  if (filters.q) conds.push(ilike(products.name, `%${filters.q}%`));
  if (filters.active === "active") conds.push(eq(products.active, true));
  if (filters.active === "inactive") conds.push(eq(products.active, false));
  const orderBy =
    filters.sort === "name_asc"
      ? asc(products.name)
      : filters.sort === "price_desc"
        ? desc(products.unitPrice)
        : filters.sort === "price_asc"
          ? asc(products.unitPrice)
          : desc(products.createdAt);
  return db.select().from(products).where(and(...conds)).orderBy(orderBy);
}

/** Active products for the quote catalog picker. */
export async function listActiveProducts(orgId: string) {
  return db
    .select({
      id: products.id,
      name: products.name,
      kind: products.kind,
      unitPrice: products.unitPrice,
      taxRate: products.taxRate,
    })
    .from(products)
    .where(and(eq(products.orgId, orgId), eq(products.active, true)))
    .orderBy(asc(products.name));
}

export async function getProduct(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(products)
    .where(and(eq(products.orgId, orgId), eq(products.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createProduct(orgId: string, input: ProductInput) {
  const [row] = await db.insert(products).values({ orgId, ...values(input) }).returning();
  return row;
}

export async function updateProduct(orgId: string, id: string, input: ProductInput) {
  const [row] = await db
    .update(products)
    .set({ ...values(input), updatedAt: new Date() })
    .where(and(eq(products.orgId, orgId), eq(products.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteProduct(orgId: string, id: string) {
  await db.delete(products).where(and(eq(products.orgId, orgId), eq(products.id, id)));
}
