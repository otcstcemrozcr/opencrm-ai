import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth/require-user";
import { getOpportunity } from "@/server/services/opportunities";
import { PageHeader } from "@/components/crm/page-header";
import { StageBadge } from "@/components/crm/status-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function OpportunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const opp = await getOpportunity(user.orgId, params.id);
  if (!opp) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={opp.name}
        description={opp.accountName ?? undefined}
        action={<Badge variant="outline">Full editing — Sprint 2</Badge>}
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Field label="Stage" value={<StageBadge stage={opp.stage} />} />
          <Field label="Value" value={formatCurrency(Number(opp.value))} />
          <Field label="Probability" value={`${opp.probability}%`} />
          <Field label="Expected close" value={opp.expectedClose} />
          <Field
            label="Account"
            value={
              opp.accountId ? (
                <Link href={`/accounts/${opp.accountId}`} className="text-accent hover:underline">
                  {opp.accountName}
                </Link>
              ) : null
            }
          />
          <Field label="Competitor" value={opp.competitor} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value ? value : <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
