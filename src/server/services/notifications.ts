import "server-only";
import { and, eq, lt, isNull, isNotNull, sql, asc } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  activities,
  organizations,
  users,
  accounts,
  contacts,
  leads,
  opportunities,
} from "@/server/db/schema";
import { sendEmail } from "@/server/email/send";
import { sendTelegram } from "@/server/notify/telegram";

type OverdueRow = {
  orgId: string;
  orgName: string;
  telegramChatId: string | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  activityId: string;
  subject: string;
  dueAt: Date | null;
  relatedLabel: string | null;
};

/** Deterministic: incomplete activities past due, in orgs with notifications on. */
async function collectOverdue(): Promise<OverdueRow[]> {
  return db
    .select({
      orgId: activities.orgId,
      orgName: organizations.name,
      telegramChatId: organizations.telegramChatId,
      ownerId: activities.ownerId,
      ownerName: users.name,
      ownerEmail: users.email,
      activityId: activities.id,
      subject: activities.subject,
      dueAt: activities.dueAt,
      relatedLabel: sql<string | null>`coalesce(${accounts.name}, ${contacts.name}, ${leads.company}, ${opportunities.name})`,
    })
    .from(activities)
    .innerJoin(organizations, eq(activities.orgId, organizations.id))
    .leftJoin(users, eq(activities.ownerId, users.id))
    .leftJoin(accounts, and(eq(activities.relatedType, "account"), eq(activities.relatedId, accounts.id)))
    .leftJoin(contacts, and(eq(activities.relatedType, "contact"), eq(activities.relatedId, contacts.id)))
    .leftJoin(leads, and(eq(activities.relatedType, "lead"), eq(activities.relatedId, leads.id)))
    .leftJoin(opportunities, and(eq(activities.relatedType, "opportunity"), eq(activities.relatedId, opportunities.id)))
    .where(
      and(
        isNull(activities.completedAt),
        isNotNull(activities.dueAt),
        lt(activities.dueAt, new Date()),
        eq(organizations.notificationsEnabled, true)
      )
    )
    .orderBy(asc(activities.orgId), asc(activities.ownerId), asc(activities.dueAt));
}

type OwnerBucket = { name: string; email: string; items: OverdueRow[] };
type OrgBucket = {
  orgId: string;
  orgName: string;
  telegramChatId: string | null;
  total: number;
  owners: Map<string, OwnerBucket>;
};

function groupByOrg(rows: OverdueRow[]): OrgBucket[] {
  const orgs = new Map<string, OrgBucket>();
  for (const r of rows) {
    let org = orgs.get(r.orgId);
    if (!org) {
      org = { orgId: r.orgId, orgName: r.orgName, telegramChatId: r.telegramChatId, total: 0, owners: new Map() };
      orgs.set(r.orgId, org);
    }
    org.total += 1;
    if (r.ownerId && r.ownerEmail) {
      let owner = org.owners.get(r.ownerId);
      if (!owner) {
        owner = { name: r.ownerName ?? "there", email: r.ownerEmail, items: [] };
        org.owners.set(r.ownerId, owner);
      }
      owner.items.push(r);
    }
  }
  return [...orgs.values()];
}

function fmtDue(d: Date | null): string {
  return d ? d.toLocaleDateString("en-US") : "—";
}

function itemLine(r: OverdueRow): string {
  const ctx = r.relatedLabel ? ` (${r.relatedLabel})` : "";
  return `${r.subject}${ctx} — due ${fmtDue(r.dueAt)}`;
}

export type DigestSummary = {
  orgs: number;
  overdueTotal: number;
  emailsSent: number;
  emailsAttempted: number;
  telegramSent: number;
};

/** Send per-owner overdue emails and a per-org Telegram digest. */
export async function runNotificationDigest(): Promise<DigestSummary> {
  const rows = await collectOverdue();
  const grouped = groupByOrg(rows);

  const summary: DigestSummary = {
    orgs: grouped.length,
    overdueTotal: rows.length,
    emailsSent: 0,
    emailsAttempted: 0,
    telegramSent: 0,
  };

  for (const org of grouped) {
    // Per-owner email
    for (const owner of org.owners.values()) {
      const list = owner.items.map((i) => `<li>${itemLine(i)}</li>`).join("");
      summary.emailsAttempted += 1;
      const { delivered } = await sendEmail({
        to: owner.email,
        subject: `You have ${owner.items.length} overdue ${owner.items.length === 1 ? "task" : "tasks"} — ${org.orgName}`,
        html: `<p>Hi ${owner.name},</p><p>These activities are past due:</p><ul>${list}</ul>`,
        text: `You have ${owner.items.length} overdue tasks:\n${owner.items.map((i) => `- ${itemLine(i)}`).join("\n")}`,
      });
      if (delivered) summary.emailsSent += 1;
    }

    // Per-org Telegram channel digest
    if (org.telegramChatId) {
      const lines = rows
        .filter((r) => r.orgId === org.orgId)
        .map((r) => `• ${itemLine(r)}${r.ownerName ? ` [${r.ownerName}]` : ""}`)
        .join("\n");
      const { delivered } = await sendTelegram(
        org.telegramChatId,
        `<b>${org.orgName}</b> — ${org.total} overdue ${org.total === 1 ? "task" : "tasks"}\n${lines}`
      );
      if (delivered) summary.telegramSent += 1;
    }
  }

  return summary;
}
