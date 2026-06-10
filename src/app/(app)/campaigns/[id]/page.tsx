import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { getCampaign, getCampaignMetrics } from "@/server/services/campaigns";
import { removeCampaign } from "@/server/actions/campaigns";
import { PageHeader } from "@/components/crm/page-header";
import { KpiCard } from "@/components/crm/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function CampaignDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const campaign = await getCampaign(user.orgId, params.id);
  if (!campaign) notFound();
  const metrics = await getCampaignMetrics(user.orgId, campaign.id, campaign.budget);
  const writable = canWrite(user.role);
  const convRate = metrics.leads > 0 ? Math.round((metrics.converted / metrics.leads) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.name}
        description={`${campaign.type} · ${campaign.status}`}
        action={
          writable ? (
            <div className="flex items-center gap-2">
              <Link href={`/campaigns/${campaign.id}/edit`} className={buttonVariants({ variant: "outline" })}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <form action={removeCampaign}>
                <input type="hidden" name="id" value={campaign.id} />
                <Button variant="destructive" type="submit"><Trash2 className="h-4 w-4" /> Delete</Button>
              </form>
            </div>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Leads" value={String(metrics.leads)} />
        <KpiCard label="Converted" value={String(metrics.converted)} hint={`${convRate}% conversion`} />
        <KpiCard label="Won Revenue" value={formatCurrency(metrics.wonRevenue)} tone="success" />
        <KpiCard
          label="ROI"
          value={metrics.roi === null ? "—" : `${Math.round(metrics.roi * 100)}%`}
          hint={campaign.budget ? `Budget ${formatCurrency(Number(campaign.budget))}` : "Set a budget for ROI"}
        />
      </div>

      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Field label="Type" value={<span className="capitalize">{campaign.type}</span>} />
          <Field label="Status" value={<Badge className="capitalize">{campaign.status}</Badge>} />
          <Field label="Start date" value={campaign.startDate} />
          <Field label="End date" value={campaign.endDate} />
          <Field label="Budget" value={campaign.budget ? formatCurrency(Number(campaign.budget)) : null} />
          {campaign.description && (
            <div className="sm:col-span-2"><Field label="Description" value={<span className="whitespace-pre-wrap">{campaign.description}</span>} /></div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Attribute leads to this campaign by selecting it on the lead form. ROI = won revenue from
        those leads&rsquo; converted opportunities ÷ budget.
      </p>
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
