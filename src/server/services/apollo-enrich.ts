import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { leads, contacts } from "@/server/db/schema";
import { enrichPerson, type ApolloPerson } from "@/server/integrations/apollo";

export type ApplyResult =
  | { configured: false }
  | { configured: true; found: false }
  | { configured: true; found: true; filled: string[] };

/** Fill only empty fields; returns the list of fields that were filled. */
function pickFills(
  current: Record<string, string | null>,
  person: ApolloPerson,
  map: { field: string; value: string | null }[]
): Record<string, string> {
  const set: Record<string, string> = {};
  for (const { field, value } of map) {
    if (value && !current[field]) set[field] = value;
  }
  return set;
}

export async function enrichLead(orgId: string, leadId: string): Promise<ApplyResult> {
  const [lead] = await db
    .select({
      company: leads.company,
      contactName: leads.contactName,
      email: leads.email,
      phone: leads.phone,
      linkedin: leads.linkedin,
      industry: leads.industry,
    })
    .from(leads)
    .where(and(eq(leads.orgId, orgId), eq(leads.id, leadId)))
    .limit(1);
  if (!lead) return { configured: true, found: false };

  const result = await enrichPerson({ email: lead.email, name: lead.contactName, organizationName: lead.company });
  if (!result.configured) return { configured: false };
  if (!result.found) return { configured: true, found: false };

  const set = pickFills(lead, result.person, [
    { field: "phone", value: result.person.phone },
    { field: "linkedin", value: result.person.linkedin },
    { field: "industry", value: result.person.industry },
  ]);
  if (Object.keys(set).length) {
    await db.update(leads).set({ ...set, updatedAt: new Date() }).where(and(eq(leads.orgId, orgId), eq(leads.id, leadId)));
  }
  return { configured: true, found: true, filled: Object.keys(set) };
}

export async function enrichContact(orgId: string, contactId: string): Promise<ApplyResult> {
  const [contact] = await db
    .select({
      name: contacts.name,
      email: contacts.email,
      phone: contacts.phone,
      linkedin: contacts.linkedin,
      title: contacts.title,
    })
    .from(contacts)
    .where(and(eq(contacts.orgId, orgId), eq(contacts.id, contactId)))
    .limit(1);
  if (!contact) return { configured: true, found: false };

  const result = await enrichPerson({ email: contact.email, name: contact.name });
  if (!result.configured) return { configured: false };
  if (!result.found) return { configured: true, found: false };

  const set = pickFills(contact, result.person, [
    { field: "title", value: result.person.title },
    { field: "linkedin", value: result.person.linkedin },
    { field: "phone", value: result.person.phone },
  ]);
  if (Object.keys(set).length) {
    await db.update(contacts).set({ ...set, updatedAt: new Date() }).where(and(eq(contacts.orgId, orgId), eq(contacts.id, contactId)));
  }
  return { configured: true, found: true, filled: Object.keys(set) };
}
