import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { opportunities } from "@/server/db/schema";
import { getAiProvider } from "./provider";

export type RiskLevel = "Low" | "Medium" | "High";

export type OpportunityInsight = {
  daysSinceActivity: number;
  overdue: boolean;
  risk: RiskLevel;
  recommendedAction: string;
  prose: string;
  source: "ai" | "deterministic";
};

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Compute a per-opportunity insight. ALL facts (days, overdue, risk, action)
 * are derived deterministically here. The AI provider, if configured, only
 * rephrases these exact facts into one sentence — it must not invent numbers.
 */
export async function getOpportunityInsight(
  orgId: string,
  oppId: string
): Promise<OpportunityInsight | null> {
  const [opp] = await db
    .select({
      stage: opportunities.stage,
      expectedClose: opportunities.expectedClose,
      lastActivityAt: opportunities.lastActivityAt,
      createdAt: opportunities.createdAt,
    })
    .from(opportunities)
    .where(and(eq(opportunities.orgId, orgId), eq(opportunities.id, oppId)))
    .limit(1);

  if (!opp) return null;

  const now = new Date();
  const isOpen = opp.stage !== "won" && opp.stage !== "lost";
  const lastActivity = opp.lastActivityAt ?? opp.createdAt;
  const daysSinceActivity = Math.max(daysBetween(lastActivity, now), 0);
  const overdue =
    isOpen && opp.expectedClose ? new Date(opp.expectedClose) < now : false;

  let risk: RiskLevel = "Low";
  if (!isOpen) {
    risk = "Low";
  } else if (overdue || daysSinceActivity >= 21) {
    risk = "High";
  } else if (daysSinceActivity >= 10) {
    risk = "Medium";
  }

  let recommendedAction: string;
  if (!isOpen) {
    recommendedAction = "No action needed — this deal is closed.";
  } else if (overdue) {
    recommendedAction = "Update the close date or push the deal forward.";
  } else if (daysSinceActivity >= 10) {
    recommendedAction = "Schedule a follow-up to re-engage.";
  } else {
    recommendedAction = "Keep the momentum with a next step.";
  }

  // Deterministic facts string — the single source of truth.
  const facts =
    `No activity in the last ${daysSinceActivity} day(s).` +
    (overdue ? " The expected close date has passed." : "") +
    ` Risk level: ${risk}. Recommended action: ${recommendedAction}`;

  // Try AI phrasing; fall back to deterministic facts on any error / no key.
  const provider = getAiProvider();
  if (provider) {
    try {
      const system =
        "You are a concise B2B revenue analyst embedded in a CRM. " +
        "Rephrase the provided facts into ONE short, professional sentence. " +
        "Do NOT add, change, or invent any numbers, dates, or facts. " +
        "Only use what is given.";
      const prose = await provider.generateLine(system, facts);
      if (prose) {
        return { daysSinceActivity, overdue, risk, recommendedAction, prose, source: "ai" };
      }
    } catch {
      // fall through to deterministic
    }
  }

  return {
    daysSinceActivity,
    overdue,
    risk,
    recommendedAction,
    prose: facts,
    source: "deterministic",
  };
}
