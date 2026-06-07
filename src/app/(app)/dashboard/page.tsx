import { getCurrentUser } from "@/server/auth/current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// MVP-0 placeholder. Real deterministic KPIs land in Sprint 3 (docs/06_reporting_kpis.md).
const KPI_PLACEHOLDERS = [
  "Open Leads",
  "Open Opportunities",
  "Pipeline Value",
  "Won Revenue",
  "Hit Ratio",
  "Forecast Revenue",
];

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back{user ? `, ${user.name}` : ""}. KPIs will be wired up in Sprint 3.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {KPI_PLACEHOLDERS.map((label) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-muted-foreground/40">—</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
