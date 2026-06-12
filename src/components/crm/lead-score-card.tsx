import { RefreshCw, Lightbulb } from "lucide-react";
import type { LeadScore } from "@/server/services/lead-score";
import type { LeadScoreExplanation } from "@/server/ai/lead-explain";
import { recalcLeadScoreAction } from "@/server/actions/leads";
import { LeadScoreBadge } from "@/components/crm/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  leadId: string;
  score: LeadScore;
  explanation?: LeadScoreExplanation | null;
  canWrite: boolean;
};

export function LeadScoreCard({ leadId, score, explanation, canWrite }: Props) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Lead score</CardTitle>
        <div className="flex items-center gap-2">
          <LeadScoreBadge score={score.score} />
          {canWrite && (
            <form action={recalcLeadScoreAction}>
              <input type="hidden" name="id" value={leadId} />
              <Button variant="ghost" size="sm" type="submit" aria-label="Recalculate score">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </form>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {score.breakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No scoring signals yet. Add contact details, a source or activities to raise the score.
          </p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {score.breakdown.map((s, i) => (
              <li key={i} className="flex items-center justify-between">
                <span className={s.points < 0 ? "text-destructive" : ""}>{s.label}</span>
                <span className={`tabular-nums ${s.points < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {s.points > 0 ? `+${s.points}` : s.points}
                </span>
              </li>
            ))}
          </ul>
        )}
        {explanation && (
          <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">Revenue Analyst</span>
            </div>
            <p className="mt-1.5 text-sm text-foreground/90">{explanation.prose}</p>
            {explanation.source === "deterministic" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Computed from your data. Set ANTHROPIC_API_KEY for AI-phrased explanations.
              </p>
            )}
          </div>
        )}

        <p className="mt-3 text-xs text-muted-foreground">
          Computed from rules — deterministic, capped at 0–100.
        </p>
      </CardContent>
    </Card>
  );
}
