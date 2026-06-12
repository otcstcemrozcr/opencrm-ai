import Link from "next/link";
import { requireUser } from "@/server/auth/require-user";
import {
  getDashboardKpis,
  getOverdueOpportunities,
  getOverdueActivities,
  getFocusThisWeek,
} from "@/server/services/dashboard";
import { summarizeFocus } from "@/server/ai/focus-summary";
import { PageHeader } from "@/components/crm/page-header";
import { KpiCard } from "@/components/crm/kpi-card";
import { FocusCard } from "@/components/crm/focus-card";
import { StageBadge } from "@/components/crm/status-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

export default async function DashboardPage() {
  const user = await requireUser();
  const [kpis, overdueOpps, overdueActs, focus] = await Promise.all([
    getDashboardKpis(user.orgId),
    getOverdueOpportunities(user.orgId),
    getOverdueActivities(user.orgId),
    getFocusThisWeek(user.orgId),
  ]);
  const focusSummary = await summarizeFocus(user.name, focus);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name}. Here is your revenue picture.`}
      />

      <FocusCard focus={focus} summary={focusSummary} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open Leads" value={String(kpis.openLeads)} />
        <KpiCard label="Open Opportunities" value={String(kpis.openOpportunities)} />
        <KpiCard label="Pipeline Value" value={formatCurrency(kpis.pipelineValue)} />
        <KpiCard
          label="Forecast Revenue"
          value={formatCurrency(kpis.forecastRevenue)}
          hint="Weighted by probability"
        />
        <KpiCard label="Won Revenue" value={formatCurrency(kpis.wonRevenue)} tone="success" />
        <KpiCard label="Lost Revenue" value={formatCurrency(kpis.lostRevenue)} tone="destructive" />
        <KpiCard label="Hit Ratio" value={pct(kpis.hitRatio)} hint="Won / closed (count)" />
        <KpiCard label="Win Rate" value={pct(kpis.winRate)} hint="Won / closed (value)" />
        <KpiCard
          label="Overdue Opportunities"
          value={String(kpis.overdueOpportunities)}
          tone={kpis.overdueOpportunities > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Overdue Activities"
          value={String(kpis.overdueActivities)}
          tone={kpis.overdueActivities > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overdue opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueOpps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing overdue. 🎉</p>
            ) : (
              <ul className="divide-y">
                {overdueOpps.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/opportunities/${o.id}`} className="text-sm font-medium text-accent hover:underline">
                      {o.name}
                    </Link>
                    <span className="flex items-center gap-3 text-sm text-muted-foreground">
                      <StageBadge stage={o.stage} />
                      <span className="tabular-nums">{formatCurrency(Number(o.value))}</span>
                      <span className="text-destructive">{o.expectedClose}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overdue activities</CardTitle>
          </CardHeader>
          <CardContent>
            {overdueActs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No overdue activities.</p>
            ) : (
              <ul className="divide-y">
                {overdueActs.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-sm font-medium">{a.subject}</span>
                    <span className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="capitalize">{a.type.replace("_", " ")}</span>
                      <span className="text-destructive">
                        {a.dueAt ? a.dueAt.toISOString().slice(0, 10) : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
