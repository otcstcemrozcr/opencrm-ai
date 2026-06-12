import "server-only";
import { getAiProvider } from "./provider";

export type NotesSummary = { prose: string; source: "ai" | "deterministic" };

export type NoteForSummary = { body: string; createdAt: Date; authorName?: string | null };

/**
 * Summarize a record's notes / meeting log into a short recap. The AI only
 * condenses the supplied text — it must not add facts, numbers, or commitments
 * that aren't in the notes (docs/07_ai_principles.md). Returns null when there
 * is nothing worth summarizing.
 */
export async function summarizeNotes(notes: NoteForSummary[]): Promise<NotesSummary | null> {
  if (notes.length < 2) return null;

  // Oldest → newest so the recap reads chronologically. Cap the input size.
  const ordered = [...notes].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const corpus = ordered
    .map((n) => `[${n.createdAt.toISOString().slice(0, 10)}${n.authorName ? ` ${n.authorName}` : ""}] ${n.body}`)
    .join("\n")
    .slice(0, 4000);

  const provider = getAiProvider();
  if (provider) {
    try {
      const system =
        "You are a B2B sales assistant. Summarize the notes below into 2-3 short bullet points " +
        "capturing key updates, decisions, and any next steps. Use ONLY information present in the " +
        "notes — do not invent facts, numbers, dates, or commitments.";
      const prose = await provider.generateText(system, corpus, 250);
      if (prose) return { prose, source: "ai" };
    } catch {
      // fall through
    }
  }

  const latest = ordered[ordered.length - 1];
  return {
    prose: `${notes.length} notes logged. Latest (${latest.createdAt.toISOString().slice(0, 10)}): ${latest.body.slice(0, 160)}${latest.body.length > 160 ? "…" : ""}`,
    source: "deterministic",
  };
}
