import Link from "next/link";
import { Lightbulb } from "lucide-react";
import type { FocusThisWeek } from "@/server/services/dashboard";
import type { FocusSummary } from "@/server/ai/focus-summary";
import { formatCurrency } from "@/lib/utils";

type Props = { focus: FocusThisWeek; summary: FocusSummary };

function Stat({ label, value, href, tone }: { label: string; value: string; href: string; tone?: "warning" | "destructive" | "success" }) {
  const toneClass =
    tone === "destructive" ? "text-destructive" : tone === "warning" ? "text-warning" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <Link
      href={href}
      className="rounded-lg border bg-card px-3 py-2 transition-colors hover:border-accent/40 hover:bg-accent/5"
    >
      <div className={`text-lg font-semibold tabular-nums ${toneClass}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Link>
  );
}

export function FocusCard({ focus, summary }: Props) {
  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 p-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium">Focus this week</span>
      </div>
      <p className="mt-2 text-sm text-foreground/90">{summary.prose}</p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Overdue activities" value={String(focus.overdueActivities)} href="/activities" tone={focus.overdueActivities > 0 ? "destructive" : undefined} />
        <Stat label="Due this week" value={String(focus.dueThisWeek)} href="/activities" tone={focus.dueThisWeek > 0 ? "warning" : undefined} />
        <Stat label="Closing this week" value={`${focus.closingThisWeek}`} href="/opportunities" tone={focus.closingThisWeek > 0 ? "success" : undefined} />
        <Stat label="Stale deals" value={String(focus.staleDeals)} href="/opportunities" tone={focus.staleDeals > 0 ? "warning" : undefined} />
        <Stat label="Hot leads" value={String(focus.hotLeads)} href="/leads?sort=score_desc" tone={focus.hotLeads > 0 ? "success" : undefined} />
      </div>

      {focus.closingThisWeek > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {formatCurrency(focus.closingThisWeekValue)} expected to close this week.
        </p>
      )}
      {summary.source === "deterministic" && (
        <p className="mt-1 text-xs text-muted-foreground">
          Computed from your data. Set ANTHROPIC_API_KEY for an AI-phrased summary.
        </p>
      )}
    </div>
  );
}
