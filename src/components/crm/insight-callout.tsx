import { Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { OpportunityInsight } from "@/server/ai/insight";

const RISK_VARIANT = {
  Low: "success",
  Medium: "warning",
  High: "destructive",
} as const;

/** Subtle, embedded analyst note — never a chat window (docs/05, docs/07). */
export function InsightCallout({ insight }: { insight: OpportunityInsight }) {
  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium">Revenue Analyst</span>
        <Badge variant={RISK_VARIANT[insight.risk]} className="ml-auto">
          {insight.risk} risk
        </Badge>
      </div>
      <p className="mt-2 text-sm text-foreground/90">{insight.prose}</p>
      {insight.source === "deterministic" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Computed from your data. Set ANTHROPIC_API_KEY for AI-phrased insights.
        </p>
      )}
    </div>
  );
}
