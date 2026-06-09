import "server-only";
import { and, eq, desc, asc, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  leads,
  accounts,
  contacts,
  opportunities,
  type LeadStatus,
} from "@/server/db/schema";

export type LeadFilters = {
  q?: string;
  status?: LeadStatus;
  sort?: string;
};

export type LeadInput = {
  company: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  source?: string | null;
  industry?: string | null;
  status?: LeadStatus;
  score?: number;
  ownerId?: string | null;
};

export async function listLeads(orgId: string, filters: LeadFilters = {}) {
  const conds: SQL[] = [eq(leads.orgId, orgId)];
  if (filters.status) conds.push(eq(leads.status, filters.status));
  if (filters.q) {
    const like = `%${filters.q}%`;
    conds.push(
      or(ilike(leads.company, like), ilike(leads.contactName, like), ilike(leads.email, like))!
    );
  }
  const orderBy =
    filters.sort === "score_desc"
      ? desc(leads.score)
      : filters.sort === "score_asc"
        ? asc(leads.score)
        : filters.sort === "company_asc"
          ? asc(leads.company)
          : filters.sort === "created_asc"
            ? asc(leads.createdAt)
            : desc(leads.createdAt);

  return db.select().from(leads).where(and(...conds)).orderBy(orderBy);
}

export async function getLead(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(leads)
    .where(and(eq(leads.orgId, orgId), eq(leads.id, id)))
    .limit(1);
  return row ?? null;
}

export async function createLead(orgId: string, input: LeadInput) {
  const [row] = await db
    .insert(leads)
    .values({
      orgId,
      company: input.company,
      contactName: input.contactName || null,
      email: input.email || null,
      phone: input.phone || null,
      linkedin: input.linkedin || null,
      source: input.source || null,
      industry: input.industry || null,
      status: input.status ?? "new",
      score: input.score ?? 0,
      ownerId: input.ownerId || null,
    })
    .returning();
  return row;
}

export async function updateLead(orgId: string, id: string, input: LeadInput) {
  const [row] = await db
    .update(leads)
    .set({
      company: input.company,
      contactName: input.contactName || null,
      email: input.email || null,
      phone: input.phone || null,
      linkedin: input.linkedin || null,
      source: input.source || null,
      industry: input.industry || null,
      status: input.status ?? "new",
      score: input.score ?? 0,
      ownerId: input.ownerId || null,
      updatedAt: new Date(),
    })
    .where(and(eq(leads.orgId, orgId), eq(leads.id, id)))
    .returning();
  return row ?? null;
}

export async function deleteLead(orgId: string, id: string) {
  await db.delete(leads).where(and(eq(leads.orgId, orgId), eq(leads.id, id)));
}

export type ConvertResult =
  | { ok: true; accountId: string; contactId: string; opportunityId: string }
  | { ok: false; error: string };

/**
 * Convert a lead into Account + Contact + Opportunity atomically.
 * Everything happens in one transaction so a partial conversion can never
 * leave orphan records (docs/04 + docs/02 convert flow).
 */
export async function convertLead(
  orgId: string,
  leadId: string,
  ownerId: string
): Promise<ConvertResult> {
  return db.transaction(async (tx) => {
    const [lead] = await tx
      .select()
      .from(leads)
      .where(and(eq(leads.orgId, orgId), eq(leads.id, leadId)))
      .limit(1);

    if (!lead) return { ok: false, error: "Lead not found." } as ConvertResult;
    if (lead.status === "converted") {
      return { ok: false, error: "Lead is already converted." } as ConvertResult;
    }

    const [account] = await tx
      .insert(accounts)
      .values({
        orgId,
        name: lead.company,
        industry: lead.industry,
        ownerId: lead.ownerId ?? ownerId,
      })
      .returning();

    const [contact] = await tx
      .insert(contacts)
      .values({
        orgId,
        accountId: account.id,
        name: lead.contactName || lead.company,
        email: lead.email,
        phone: lead.phone,
        linkedin: lead.linkedin,
        ownerId: lead.ownerId ?? ownerId,
      })
      .returning();

    const [opportunity] = await tx
      .insert(opportunities)
      .values({
        orgId,
        accountId: account.id,
        name: `${lead.company} — New opportunity`,
        stage: "new",
        ownerId: lead.ownerId ?? ownerId,
      })
      .returning();

    await tx
      .update(leads)
      .set({
        status: "converted",
        convertedAccountId: account.id,
        convertedContactId: contact.id,
        convertedOpportunityId: opportunity.id,
        updatedAt: new Date(),
      })
      .where(and(eq(leads.orgId, orgId), eq(leads.id, leadId)));

    return {
      ok: true,
      accountId: account.id,
      contactId: contact.id,
      opportunityId: opportunity.id,
    } as ConvertResult;
  });
}
