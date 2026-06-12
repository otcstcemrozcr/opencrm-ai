import "server-only";
import { getAiProvider } from "./provider";
import type { FocusThisWeek } from "@/server/services/dashboard";

export type FocusSummary = { prose: string; source: "ai" | "deterministic" };

/**
 * Phrase a one-sentence "focus this week" note. All numbers are computed
 * deterministically (dashboard.ts); the AI provider only rephrases the given
 * facts and must not invent or change any number (docs/07_ai_principles.md).
 */
export async function summarizeFocus(userName: string, f: FocusThisWeek): Promise<FocusSummary> {
  const parts: string[] = [];
  if (f.overdueActivities > 0) parts.push(`${f.overdueActivities} overdue activit${f.overdueActivities === 1 ? "y" : "ies"}`);
  if (f.dueThisWeek > 0) parts.push(`${f.dueThisWeek} task${f.dueThisWeek === 1 ? "" : "s"} due this week`);
  if (f.closingThisWeek > 0) parts.push(`${f.closingThisWeek} deal${f.closingThisWeek === 1 ? "" : "s"} expected to close this week`);
  if (f.staleDeals > 0) parts.push(`${f.staleDeals} stale open deal${f.staleDeals === 1 ? "" : "s"} (no activity in 21+ days)`);
  if (f.hotLeads > 0) parts.push(`${f.hotLeads} hot lead${f.hotLeads === 1 ? "" : "s"} to engage`);

  const facts =
    parts.length === 0
      ? "Nothing urgent this week — pipeline is up to date."
      : `This week: ${parts.join("; ")}.`;

  const provider = getAiProvider();
  if (provider && parts.length > 0) {
    try {
      const system =
        "You are a concise B2B revenue analyst in a CRM. In ONE short, motivating sentence, " +
        "tell the rep where to focus this week. Do NOT add, change, or invent any numbers or " +
        "facts — only use what is given.";
      const prose = await provider.generateLine(system, `For ${userName}. ${facts}`);
      if (prose) return { prose, source: "ai" };
    } catch {
      // fall through
    }
  }

  return { prose: facts, source: "deterministic" };
}
