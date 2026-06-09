import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  accounts,
  contacts,
  opportunities,
  quotes,
  activities,
  notes,
} from "@/server/db/schema";

export type DupMember = { id: string; label: string; createdAt: Date };
export type DupGroup = { key: string; members: DupMember[] };

function groupBy(rows: { id: string; label: string; key: string; createdAt: Date }[]): DupGroup[] {
  const map = new Map<string, DupMember[]>();
  for (const r of rows) {
    if (!r.key) continue;
    const arr = map.get(r.key) ?? [];
    arr.push({ id: r.id, label: r.label, createdAt: r.createdAt });
    map.set(r.key, arr);
  }
  return [...map.entries()]
    .filter(([, m]) => m.length > 1)
    .map(([key, members]) => ({ key, members }));
}

export async function findDuplicateAccounts(orgId: string): Promise<DupGroup[]> {
  const rows = await db
    .select({ id: accounts.id, name: accounts.name, createdAt: accounts.createdAt })
    .from(accounts)
    .where(eq(accounts.orgId, orgId));
  return groupBy(rows.map((r) => ({ id: r.id, label: r.name, key: r.name.trim().toLowerCase(), createdAt: r.createdAt })));
}

export async function findDuplicateContacts(orgId: string): Promise<DupGroup[]> {
  const rows = await db
    .select({ id: contacts.id, name: contacts.name, email: contacts.email, createdAt: contacts.createdAt })
    .from(contacts)
    .where(eq(contacts.orgId, orgId));
  return groupBy(
    rows
      .filter((r) => r.email)
      .map((r) => ({ id: r.id, label: `${r.name} (${r.email})`, key: r.email!.trim().toLowerCase(), createdAt: r.createdAt }))
  );
}

/** Merge dup accounts into primary: reparent children, then delete dups. */
export async function mergeAccounts(orgId: string, primaryId: string, dupIds: string[]) {
  const ids = dupIds.filter((id) => id !== primaryId);
  if (ids.length === 0) return;
  await db.transaction(async (tx) => {
    await tx.update(contacts).set({ accountId: primaryId }).where(and(eq(contacts.orgId, orgId), inArray(contacts.accountId, ids)));
    await tx.update(opportunities).set({ accountId: primaryId }).where(and(eq(opportunities.orgId, orgId), inArray(opportunities.accountId, ids)));
    await tx.update(quotes).set({ accountId: primaryId }).where(and(eq(quotes.orgId, orgId), inArray(quotes.accountId, ids)));
    await tx.update(activities).set({ relatedId: primaryId }).where(and(eq(activities.orgId, orgId), eq(activities.relatedType, "account"), inArray(activities.relatedId, ids)));
    await tx.update(notes).set({ relatedId: primaryId }).where(and(eq(notes.orgId, orgId), eq(notes.relatedType, "account"), inArray(notes.relatedId, ids)));
    await tx.delete(accounts).where(and(eq(accounts.orgId, orgId), inArray(accounts.id, ids)));
  });
}

/** Merge dup contacts into primary: reparent activities/notes, then delete dups. */
export async function mergeContacts(orgId: string, primaryId: string, dupIds: string[]) {
  const ids = dupIds.filter((id) => id !== primaryId);
  if (ids.length === 0) return;
  await db.transaction(async (tx) => {
    await tx.update(activities).set({ relatedId: primaryId }).where(and(eq(activities.orgId, orgId), eq(activities.relatedType, "contact"), inArray(activities.relatedId, ids)));
    await tx.update(notes).set({ relatedId: primaryId }).where(and(eq(notes.orgId, orgId), eq(notes.relatedType, "contact"), inArray(notes.relatedId, ids)));
    await tx.delete(contacts).where(and(eq(contacts.orgId, orgId), inArray(contacts.id, ids)));
  });
}
