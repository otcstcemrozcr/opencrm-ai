import { NotebookPen } from "lucide-react";
import type { NotesSummary } from "@/server/ai/notes-summary";

/** Subtle recap of a record's notes — embedded, never a chat window. */
export function NotesSummaryCard({ summary }: { summary: NotesSummary }) {
  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
      <div className="flex items-center gap-2">
        <NotebookPen className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium">Notes recap</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{summary.prose}</p>
      {summary.source === "deterministic" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Set ANTHROPIC_API_KEY for an AI-written recap.
        </p>
      )}
    </div>
  );
}
