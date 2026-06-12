import "server-only";
import { getAiProvider } from "./provider";

export type AssistantAnswer = { answer: string; source: "ai" | "deterministic" };

/**
 * Answer a rep's question using ONLY the deterministic metrics snapshot. The
 * AI may phrase and compute simple ratios from the given numbers, but must not
 * invent any figure that isn't derivable from the snapshot (docs/07). When no
 * provider is configured we return the raw snapshot so the rep still sees the
 * grounded numbers.
 */
export async function answerWithMetrics(question: string, facts: string): Promise<AssistantAnswer> {
  const provider = getAiProvider();
  if (provider) {
    try {
      const system =
        "You are a B2B revenue analyst embedded in a CRM. Answer the user's question using ONLY " +
        "the metrics provided below. You may quote the numbers and compute simple ratios or " +
        "percentages strictly from these figures, but NEVER invent, estimate, or assume any number " +
        "that is not present or directly derivable. If the answer isn't in the data, say you don't " +
        "have that metric. Be concise (2-4 sentences). Do not use markdown tables.\n\n" +
        `METRICS:\n${facts}`;
      const answer = await provider.generateText(system, question, 400);
      if (answer) return { answer, source: "ai" };
    } catch {
      // fall through
    }
  }

  return {
    answer:
      "AI phrasing isn't configured (set ANTHROPIC_API_KEY). Here are your current metrics:\n\n" +
      facts,
    source: "deterministic",
  };
}
