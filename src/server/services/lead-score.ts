import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { leads, activities, type LeadStatus } from "@/server/db/schema";

export type ScoreSignal = { label: string; points: number };
export type LeadTier = "hot" | "warm" | "cold";
export type LeadScore = { score: number; tier: LeadTier; breakdown: ScoreSignal[] };

export type ScoreInput = {
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  source: string | null;
  estimatedValue: string | null;
  rating: "hot" | "warm" | "cold" | null;
  status: LeadStatus;
  doNotContact: boolean;
  lastActivityAt: Date | null;
  createdAt: Date;
  activityCount: number;
};

function daysSince(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

/** Map a free-text source to a quality score using keyword buckets. */
function sourcePoints(source: string | null): ScoreSignal | null {
  if (!source) return null;
  const s = source.toLowerCase();
  const match = (...keys: string[]) => keys.some((k) => s.includes(k));
  if (match("referral", "partner")) return { label: "Source: referral/partner", points: 20 };
  if (match("inbound", "website", "demo request", "contact form")) return { label: "Source: inbound", points: 15 };
  if (match("event", "webinar", "conference", "trade")) return { label: "Source: event/webinar", points: 10 };
  if (match("linkedin", "ads", "paid", "google", "campaign")) return { label: "Source: paid/social", points: 8 };
  if (match("list", "cold", "apollo", "scrape", "purchased")) return { label: "Source: cold list", points: 3 };
  return { label: "Source: other", points: 2 };
}

const tierFor = (score: number): LeadTier => (score >= 70 ? "hot" : score >= 40 ? "warm" : "cold");

/**
 * Deterministic lead score from explicit rules. This is the single source of
 * truth for the number — AI (10B) may only explain it, never change it.
 */
export function computeLeadScore(input: ScoreInput): LeadScore {
  const breakdown: ScoreSignal[] = [];

  if (input.email) breakdown.push({ label: "Email on file", points: 15 });
  if (input.phone) breakdown.push({ label: "Phone on file", points: 10 });
  if (input.linkedin) breakdown.push({ label: "LinkedIn profile", points: 5 });

  const sp = sourcePoints(input.source);
  if (sp) breakdown.push(sp);

  const value = input.estimatedValue ? Number(input.estimatedValue) : 0;
  if (value >= 100000) breakdown.push({ label: "Deal value ≥ 100k", points: 20 });
  else if (value >= 50000) breakdown.push({ label: "Deal value ≥ 50k", points: 15 });
  else if (value >= 10000) breakdown.push({ label: "Deal value ≥ 10k", points: 10 });
  else if (value > 0) breakdown.push({ label: "Deal value set", points: 5 });

  if (input.lastActivityAt) {
    const days = daysSince(input.lastActivityAt);
    if (days <= 7) breakdown.push({ label: "Active in last 7 days", points: 15 });
    else if (days <= 30) breakdown.push({ label: "Active in last 30 days", points: 8 });
  } else if (daysSince(input.createdAt) <= 7) {
    breakdown.push({ label: "Recently created", points: 5 });
  }

  if (input.activityCount > 0) {
    breakdown.push({
      label: `${input.activityCount} logged ${input.activityCount === 1 ? "activity" : "activities"}`,
      points: Math.min(input.activityCount * 5, 15),
    });
  }

  if (input.rating === "hot") breakdown.push({ label: "Rated hot", points: 10 });
  else if (input.rating === "warm") breakdown.push({ label: "Rated warm", points: 5 });

  if (input.doNotContact) breakdown.push({ label: "Do-not-contact", points: -30 });
  if (input.status === "unqualified") breakdown.push({ label: "Marked unqualified", points: -20 });

  const raw = breakdown.reduce((sum, s) => sum + s.points, 0);
  const score = Math.max(0, Math.min(100, raw));

  return { score, tier: tierFor(score), breakdown };
}

async function loadScoreInput(orgId: string, leadId: string): Promise<ScoreInput | null> {
  const [lead] = await db
    .select({
      email: leads.email,
      phone: leads.phone,
      linkedin: leads.linkedin,
      source: leads.source,
      estimatedValue: leads.estimatedValue,
      rating: leads.rating,
      status: leads.status,
      doNotContact: leads.doNotContact,
      lastActivityAt: leads.lastActivityAt,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .where(and(eq(leads.orgId, orgId), eq(leads.id, leadId)))
    .limit(1);
  if (!lead) return null;

  const [agg] = await db
    .select({ n: sql<number>`count(*)` })
    .from(activities)
    .where(
      and(
        eq(activities.orgId, orgId),
        eq(activities.relatedType, "lead"),
        eq(activities.relatedId, leadId)
      )
    );

  return { ...lead, activityCount: Number(agg?.n ?? 0) };
}

/** Compute the score for display, without persisting. */
export async function getLeadScore(orgId: string, leadId: string): Promise<LeadScore | null> {
  const input = await loadScoreInput(orgId, leadId);
  return input ? computeLeadScore(input) : null;
}

/** Compute and persist the score onto leads.score. Returns the result. */
export async function recomputeLeadScore(orgId: string, leadId: string): Promise<LeadScore | null> {
  const input = await loadScoreInput(orgId, leadId);
  if (!input) return null;
  const result = computeLeadScore(input);
  await db
    .update(leads)
    .set({ score: result.score, updatedAt: new Date() })
    .where(and(eq(leads.orgId, orgId), eq(leads.id, leadId)));
  return result;
}

export const leadTier = tierFor;
