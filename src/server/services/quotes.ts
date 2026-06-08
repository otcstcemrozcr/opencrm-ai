import "server-only";
import { and, eq, desc, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  quotes,
  quoteLines,
  accounts,
  opportunities,
  organizations,
  type QuoteStatus,
  type QuoteLineKind,
} from "@/server/db/schema";

export type QuoteLineInput = {
  kind: QuoteLineKind;
  name: string;
  description?: string | null;
  qty: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
};

export type QuoteInput = {
  accountId?: string | null;
  opportunityId?: string | null;
  status?: QuoteStatus;
  currency?: string;
  notes?: string | null;
  validUntil?: string | null;
};

export type QuoteTotals = {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  lines: (QuoteLineInput & { lineTotal: number })[];
};

/** Deterministic money math. lineTotal is the taxable amount (qty*price - discount). */
export function computeTotals(lines: QuoteLineInput[]): QuoteTotals {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  const computed = lines.map((l) => {
    const gross = l.qty * l.unitPrice;
    const lineTotal = Math.max(gross - l.discount, 0);
    const lineTax = (lineTotal * l.taxRate) / 100;
    subtotal += gross;
    discount += l.discount;
    tax += lineTax;
    return { ...l, lineTotal };
  });
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    subtotal: round(subtotal),
    discount: round(discount),
    tax: round(tax),
    total: round(subtotal - discount + tax),
    lines: computed,
  };
}

async function nextQuoteNo(orgId: string): Promise<string> {
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(quotes)
    .where(eq(quotes.orgId, orgId));
  const year = new Date().getFullYear();
  return `Q-${year}-${String(Number(c) + 1).padStart(4, "0")}`;
}

export async function listQuotes(orgId: string) {
  return db
    .select({
      id: quotes.id,
      quoteNo: quotes.quoteNo,
      status: quotes.status,
      total: quotes.total,
      currency: quotes.currency,
      validUntil: quotes.validUntil,
      accountId: quotes.accountId,
      accountName: accounts.name,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .leftJoin(accounts, eq(quotes.accountId, accounts.id))
    .where(eq(quotes.orgId, orgId))
    .orderBy(desc(quotes.createdAt));
}

export async function getQuote(orgId: string, id: string) {
  const [quote] = await db
    .select({
      id: quotes.id,
      quoteNo: quotes.quoteNo,
      version: quotes.version,
      status: quotes.status,
      currency: quotes.currency,
      subtotal: quotes.subtotal,
      discount: quotes.discount,
      tax: quotes.tax,
      total: quotes.total,
      notes: quotes.notes,
      validUntil: quotes.validUntil,
      accountId: quotes.accountId,
      accountName: accounts.name,
      opportunityId: quotes.opportunityId,
      opportunityName: opportunities.name,
      createdAt: quotes.createdAt,
    })
    .from(quotes)
    .leftJoin(accounts, eq(quotes.accountId, accounts.id))
    .leftJoin(opportunities, eq(quotes.opportunityId, opportunities.id))
    .where(and(eq(quotes.orgId, orgId), eq(quotes.id, id)))
    .limit(1);
  if (!quote) return null;

  const lines = await db
    .select()
    .from(quoteLines)
    .where(and(eq(quoteLines.orgId, orgId), eq(quoteLines.quoteId, id)))
    .orderBy(quoteLines.sortOrder);

  return { ...quote, lines };
}

export async function getQuoteForPdf(orgId: string, id: string) {
  const quote = await getQuote(orgId, id);
  if (!quote) return null;
  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return { ...quote, orgName: org?.name ?? "OpenCRM AI" };
}

export async function createQuote(
  orgId: string,
  input: QuoteInput,
  lines: QuoteLineInput[]
) {
  const totals = computeTotals(lines);
  const quoteNo = await nextQuoteNo(orgId);

  return db.transaction(async (tx) => {
    const [quote] = await tx
      .insert(quotes)
      .values({
        orgId,
        accountId: input.accountId || null,
        opportunityId: input.opportunityId || null,
        quoteNo,
        status: input.status ?? "draft",
        currency: input.currency || "USD",
        notes: input.notes || null,
        validUntil: input.validUntil || null,
        subtotal: String(totals.subtotal),
        discount: String(totals.discount),
        tax: String(totals.tax),
        total: String(totals.total),
      })
      .returning();

    if (totals.lines.length > 0) {
      await tx.insert(quoteLines).values(
        totals.lines.map((l, i) => ({
          orgId,
          quoteId: quote.id,
          kind: l.kind,
          name: l.name,
          description: l.description || null,
          qty: String(l.qty),
          unitPrice: String(l.unitPrice),
          discount: String(l.discount),
          taxRate: String(l.taxRate),
          lineTotal: String(l.lineTotal),
          sortOrder: i,
        }))
      );
    }
    return quote;
  });
}

export async function updateQuote(
  orgId: string,
  id: string,
  input: QuoteInput,
  lines: QuoteLineInput[]
) {
  const totals = computeTotals(lines);

  return db.transaction(async (tx) => {
    const [quote] = await tx
      .update(quotes)
      .set({
        accountId: input.accountId || null,
        opportunityId: input.opportunityId || null,
        status: input.status ?? "draft",
        currency: input.currency || "USD",
        notes: input.notes || null,
        validUntil: input.validUntil || null,
        subtotal: String(totals.subtotal),
        discount: String(totals.discount),
        tax: String(totals.tax),
        total: String(totals.total),
        updatedAt: new Date(),
      })
      .where(and(eq(quotes.orgId, orgId), eq(quotes.id, id)))
      .returning();
    if (!quote) return null;

    await tx.delete(quoteLines).where(and(eq(quoteLines.orgId, orgId), eq(quoteLines.quoteId, id)));
    if (totals.lines.length > 0) {
      await tx.insert(quoteLines).values(
        totals.lines.map((l, i) => ({
          orgId,
          quoteId: id,
          kind: l.kind,
          name: l.name,
          description: l.description || null,
          qty: String(l.qty),
          unitPrice: String(l.unitPrice),
          discount: String(l.discount),
          taxRate: String(l.taxRate),
          lineTotal: String(l.lineTotal),
          sortOrder: i,
        }))
      );
    }
    return quote;
  });
}

export async function setQuoteStatus(orgId: string, id: string, status: QuoteStatus) {
  const [row] = await db
    .update(quotes)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(quotes.orgId, orgId), eq(quotes.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteQuote(orgId: string, id: string) {
  await db.delete(quotes).where(and(eq(quotes.orgId, orgId), eq(quotes.id, id)));
}
