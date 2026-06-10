import { requireUser } from "@/server/auth/require-user";
import {
  pipelineByStage,
  revenueByOwner,
  revenueByIndustry,
  leadsByStatus,
  forecastBuckets,
} from "@/server/services/reports";
import { PageHeader } from "@/components/crm/page-header";
import { KpiCard } from "@/components/crm/kpi-card";
import { ReportBar, ReportPie } from "@/components/crm/charts";
import { EmptyState } from "@/components/crm/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsPage() {
  const user = await requireUser();
  const [pipeline, byOwner, byIndustry, byStatus, forecast] = await Promise.all([
    pipelineByStage(user.orgId),
    revenueByOwner(user.orgId),
    revenueByIndustry(user.orgId),
    leadsByStatus(user.orgId),
    forecastBuckets(user.orgId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Deterministic analytics across your revenue data." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Forecast — 30 days" value={formatCurrency(forecast.d30)} hint="Weighted" />
        <KpiCard label="Forecast — 60 days" value={formatCurrency(forecast.d60)} hint="Weighted" />
        <KpiCard label="Forecast — 90 days" value={formatCurrency(forecast.d90)} hint="Weighted" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Open pipeline by stage">
          {pipeline.length ? <ReportBar data={pipeline} xKey="stage" barKey="value" money /> : <Empty />}
        </ChartCard>
        <ChartCard title="Leads by status">
          {byStatus.length ? <ReportPie data={byStatus} nameKey="name" valueKey="count" /> : <Empty />}
        </ChartCard>
        <ChartCard title="Won revenue by salesperson">
          {byOwner.length ? <ReportBar data={byOwner} xKey="name" barKey="value" money /> : <Empty />}
        </ChartCard>
        <ChartCard title="Won revenue by industry">
          {byIndustry.length ? <ReportBar data={byIndustry} xKey="name" barKey="value" money /> : <Empty />}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Empty() {
  return <EmptyState title="No data yet" description="This chart populates as you add records." />;
}
