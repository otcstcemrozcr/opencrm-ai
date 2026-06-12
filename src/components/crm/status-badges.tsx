import { Badge } from "@/components/ui/badge";
import type { LeadStatus, OpportunityStage, QuoteStatus } from "@/server/db/schema";

const LEAD_VARIANT: Record<LeadStatus, "default" | "accent" | "success" | "warning" | "destructive"> = {
  new: "default",
  working: "accent",
  qualified: "success",
  unqualified: "destructive",
  converted: "success",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge variant={LEAD_VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  );
}

/** Lead score tier badge. Tier thresholds mirror lead-score.ts (cold<40<warm<70<hot). */
export function LeadScoreBadge({ score }: { score: number }) {
  const tier = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  const variant = tier === "hot" ? "success" : tier === "warm" ? "warning" : "default";
  return (
    <Badge variant={variant} className="tabular-nums">
      {score} · <span className="capitalize">{tier}</span>
    </Badge>
  );
}

const STAGE_VARIANT: Record<OpportunityStage, "default" | "accent" | "success" | "warning" | "destructive"> = {
  new: "default",
  qualified: "accent",
  discovery: "accent",
  meeting: "accent",
  proposal: "warning",
  negotiation: "warning",
  won: "success",
  lost: "destructive",
};

export function StageBadge({ stage }: { stage: OpportunityStage }) {
  return (
    <Badge variant={STAGE_VARIANT[stage]} className="capitalize">
      {stage}
    </Badge>
  );
}

const QUOTE_VARIANT: Record<QuoteStatus, "default" | "accent" | "success" | "warning" | "destructive"> = {
  draft: "default",
  sent: "accent",
  accepted: "success",
  rejected: "destructive",
  expired: "warning",
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <Badge variant={QUOTE_VARIANT[status]} className="capitalize">
      {status}
    </Badge>
  );
}
