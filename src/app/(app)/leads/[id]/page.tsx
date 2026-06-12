import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { getLead } from "@/server/services/leads";
import { listNotes } from "@/server/services/notes";
import { getRecordFields } from "@/server/services/custom-fields";
import { getLeadScore } from "@/server/services/lead-score";
import { explainLeadScore } from "@/server/ai/lead-explain";
import { summarizeNotes } from "@/server/ai/notes-summary";
import { removeLead, convertLeadAction } from "@/server/actions/leads";
import { PageHeader } from "@/components/crm/page-header";
import { LeadStatusBadge, LeadScoreBadge } from "@/components/crm/status-badges";
import { NotePanel } from "@/components/crm/note-panel";
import { NotesSummaryCard } from "@/components/crm/notes-summary";
import { CustomFieldsPanel } from "@/components/crm/custom-fields-panel";
import { LeadScoreCard } from "@/components/crm/lead-score-card";
import { EmailComposePanel } from "@/components/crm/email-compose-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const user = await requireUser();
  const lead = await getLead(user.orgId, params.id);
  if (!lead) notFound();

  const writable = canWrite(user.role);
  const converted = lead.status === "converted";
  const [notes, customFields, leadScore] = await Promise.all([
    listNotes(user.orgId, "lead", lead.id),
    getRecordFields(user.orgId, "lead", lead.id),
    getLeadScore(user.orgId, lead.id),
  ]);
  const scoreExplanation = leadScore ? await explainLeadScore(lead.company, leadScore) : null;
  const notesSummary = await summarizeNotes(notes);

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.company}
        description={lead.contactName ?? undefined}
        action={
          writable ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/leads/${lead.id}/edit`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <form action={removeLead}>
                <input type="hidden" name="id" value={lead.id} />
                <Button variant="destructive" type="submit">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </form>
            </div>
          ) : null
        }
      />

      {searchParams.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {searchParams.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Lead details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <Field label="Status" value={<LeadStatusBadge status={lead.status} />} />
            <Field label="Score" value={leadScore ? <LeadScoreBadge score={leadScore.score} /> : String(lead.score)} />
            <Field label="Rating" value={lead.rating ? <span className="capitalize">{lead.rating}</span> : null} />
            <Field label="Estimated value" value={lead.estimatedValue ? `$${Number(lead.estimatedValue).toLocaleString("en-US")}` : null} />
            {lead.doNotContact && <Field label="Compliance" value={<span className="text-destructive">Do not contact</span>} />}
            <Field label="UTM" value={[lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ") || null} />
            <Field label="Email" value={lead.email} />
            <Field label="Phone" value={lead.phone} />
            <Field label="Source" value={lead.source} />
            <Field label="Industry" value={lead.industry} />
            <Field
              label="LinkedIn"
              value={
                lead.linkedin ? (
                  <a href={lead.linkedin} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    Profile
                  </a>
                ) : null
              }
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Convert</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {converted ? (
              <div className="space-y-2">
                <p className="text-muted-foreground">This lead has been converted.</p>
                {lead.convertedAccountId && (
                  <Link href={`/accounts/${lead.convertedAccountId}`} className="block text-accent hover:underline">
                    → View account
                  </Link>
                )}
                {lead.convertedOpportunityId && (
                  <Link href={`/opportunities/${lead.convertedOpportunityId}`} className="block text-accent hover:underline">
                    → View opportunity
                  </Link>
                )}
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Convert this lead into an Account, Contact and Opportunity in one step.
                </p>
                {writable && (
                  <form action={convertLeadAction}>
                    <input type="hidden" name="id" value={lead.id} />
                    <Button type="submit" className="w-full">
                      <ArrowRightLeft className="h-4 w-4" /> Convert lead
                    </Button>
                  </form>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {leadScore && (
        <LeadScoreCard
          leadId={lead.id}
          score={leadScore}
          explanation={scoreExplanation}
          canWrite={writable}
        />
      )}

      {writable && !converted && (
        <EmailComposePanel
          relatedType="lead"
          relatedId={lead.id}
          recipientName={lead.contactName || lead.company}
          company={lead.company}
          defaultTo={lead.email ?? ""}
        />
      )}

      <CustomFieldsPanel
        entity="lead"
        recordId={lead.id}
        canWrite={writable}
        fields={customFields}
      />

      {notesSummary && <NotesSummaryCard summary={notesSummary} />}

      <NotePanel
        relatedType="lead"
        relatedId={lead.id}
        canWrite={writable}
        items={notes.map((n) => ({
          id: n.id,
          body: n.body,
          authorName: n.authorName,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
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
