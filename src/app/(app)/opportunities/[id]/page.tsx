import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { getOpportunity } from "@/server/services/opportunities";
import { listActivities } from "@/server/services/activities";
import { getOpportunityInsight } from "@/server/ai/insight";
import { listNotes } from "@/server/services/notes";
import { getRecordFields } from "@/server/services/custom-fields";
import { removeOpportunity } from "@/server/actions/opportunities";
import { PageHeader } from "@/components/crm/page-header";
import { StageBadge } from "@/components/crm/status-badges";
import { InsightCallout } from "@/components/crm/insight-callout";
import { ActivityPanel } from "@/components/crm/activity-panel";
import { NotePanel } from "@/components/crm/note-panel";
import { CustomFieldsPanel } from "@/components/crm/custom-fields-panel";
import { Button, buttonVariants } from "@/components/ui/button";
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

  const [activities, insight, notes, customFields] = await Promise.all([
    listActivities(user.orgId, "opportunity", opp.id),
    getOpportunityInsight(user.orgId, opp.id),
    listNotes(user.orgId, "opportunity", opp.id),
    getRecordFields(user.orgId, "opportunity", opp.id),
  ]);
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title={opp.name}
        description={opp.accountName ?? undefined}
        action={
          writable ? (
            <div className="flex items-center gap-2">
              <Link href={`/opportunities/${opp.id}/edit`} className={buttonVariants({ variant: "outline" })}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <form action={removeOpportunity}>
                <input type="hidden" name="id" value={opp.id} />
                <Button variant="destructive" type="submit">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </form>
            </div>
          ) : null
        }
      />

      {insight && <InsightCallout insight={insight} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Stage" value={<StageBadge stage={opp.stage} />} />
            <Field label="Value" value={formatCurrency(Number(opp.value))} />
            <Field label="Probability" value={`${opp.probability}%`} />
            <Field
              label="Weighted"
              value={formatCurrency((Number(opp.value) * opp.probability) / 100)}
            />
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
            <Field label="Forecast category" value={<span className="capitalize">{opp.forecastCategory.replace("_", " ")}</span>} />
            <Field label="Currency" value={opp.currency} />
            <Field label="Next step" value={opp.nextStep} />
            {opp.stage === "lost" && <Field label="Loss reason" value={opp.lossReason} />}
            {opp.notes && <Field label="Notes" value={<span className="whitespace-pre-wrap">{opp.notes}</span>} />}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <ActivityPanel
            relatedType="opportunity"
            relatedId={opp.id}
            canWrite={writable}
            items={activities.map((a) => ({
              id: a.id,
              type: a.type,
              subject: a.subject,
              notes: a.notes,
              dueAt: a.dueAt ? a.dueAt.toISOString() : null,
              completedAt: a.completedAt ? a.completedAt.toISOString() : null,
              createdAt: a.createdAt.toISOString(),
            }))}
          />
          <CustomFieldsPanel
            entity="opportunity"
            recordId={opp.id}
            canWrite={writable}
            fields={customFields}
          />
          <NotePanel
            relatedType="opportunity"
            relatedId={opp.id}
            canWrite={writable}
            items={notes.map((n) => ({
              id: n.id,
              body: n.body,
              authorName: n.authorName,
              createdAt: n.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
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
