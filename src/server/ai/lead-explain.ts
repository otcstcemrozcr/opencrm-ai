import "server-only";
import { getAiProvider } from "./provider";
import type { LeadScore } from "@/server/services/lead-score";

export type LeadScoreExplanation = { prose: string; source: "ai" | "deterministic" };

/**
 * Explain a lead score in prose. The number and every signal are computed
 * deterministically upstream (lead-score.ts); the AI provider, if configured,
 * only rephrases the given facts into one or two sentences and suggests a next
 * action. It must never invent or change numbers (docs/07_ai_principles.md).
 */
export async function explainLeadScore(
  company: string,
  score: LeadScore
): Promise<LeadScoreExplanation> {
  const positives = score.breakdown.filter((s) => s.points > 0).map((s) => s.label);
  const negatives = score.breakdown.filter((s) => s.points < 0).map((s) => s.label);

  const facts =
    `Lead "${company}" scores ${score.score} out of 100 (${score.tier}). ` +
    (positives.length ? `Strengths: ${positives.join(", ")}. ` : "No positive signals yet. ") +
    (negatives.length ? `Concerns: ${negatives.join(", ")}. ` : "");

  const provider = getAiProvider();
  if (provider) {
    try {
      const system =
        "You are a concise B2B revenue analyst embedded in a CRM. In ONE or TWO short " +
        "sentences, explain what this lead score means and the single best next action. " +
        "Do NOT add, change, or invent any numbers, names, or facts — only use what is given.";
      const prose = await provider.generateLine(system, facts);
      if (prose) return { prose, source: "ai" };
    } catch {
      // fall through to deterministic
    }
  }

  const action =
    score.tier === "hot"
      ? "Prioritize outreach now."
      : score.tier === "warm"
        ? "Nurture with a timely follow-up."
        : "Enrich the missing details before investing more time.";

  return { prose: `${facts}${action}`, source: "deterministic" };
}
