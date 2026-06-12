import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listLeads, type LeadFilters } from "@/server/services/leads";
import { listOrgUsers } from "@/server/services/users";
import { listSavedViews } from "@/server/services/saved-views";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { FilterBar } from "@/components/crm/filter-bar";
import { SavedViews } from "@/components/crm/saved-views";
import { SelectableTable } from "@/components/crm/selectable-table";
import { LeadStatusBadge, LeadScoreBadge } from "@/components/crm/status-badges";
import { buttonVariants } from "@/components/ui/button";

const LEAD_STATUSES = ["new", "working", "qualified", "unqualified", "converted"];

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; sort?: string };
}) {
  const user = await requireUser();
  const [rows, owners, views] = await Promise.all([
    listLeads(user.orgId, searchParams as LeadFilters),
    listOrgUsers(user.orgId),
    listSavedViews(user.orgId, user.id, "lead"),
  ]);
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Inbound and prospected leads to qualify."
        action={
          writable ? (
            <div className="flex items-center gap-2">
              <Link href="/import?entity=lead" className={buttonVariants({ variant: "outline" })}>
                <Upload className="h-4 w-4" /> Import
              </Link>
              <Link href="/leads/new" className={buttonVariants()}>
                <Plus className="h-4 w-4" /> New lead
              </Link>
            </div>
          ) : null
        }
      />

      <FilterBar
        searchPlaceholder="Search company, contact, email…"
        filters={[{ name: "status", label: "Status", options: LEAD_STATUSES.map((s) => ({ value: s, label: s })) }]}
        sorts={[
          { value: "score_desc", label: "Score (high→low)" },
          { value: "score_asc", label: "Score (low→high)" },
          { value: "company_asc", label: "Company (A→Z)" },
          { value: "created_asc", label: "Oldest" },
        ]}
      />

      <SavedViews entity="lead" views={views.map((v) => ({ id: v.id, name: v.name, query: v.query }))} />

      {rows.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="No leads match your filters, or none exist yet."
          action={
            writable ? (
              <Link href="/leads/new" className={buttonVariants()}>
                <Plus className="h-4 w-4" /> New lead
              </Link>
            ) : null
          }
        />
      ) : (
        <SelectableTable
          entity="lead"
          canWrite={writable}
          ownerOptions={owners.map((u) => ({ id: u.id, name: u.name }))}
          headers={["Company", "Contact", "Source", "Status", "Score"]}
          rows={rows.map((l) => ({
            id: l.id,
            cells: [
              <Link key="c" href={`/leads/${l.id}`} className="font-medium text-accent hover:underline">{l.company}</Link>,
              <span className="text-muted-foreground">{l.contactName ?? "—"}</span>,
              <span className="text-muted-foreground">{l.source ?? "—"}</span>,
              <LeadStatusBadge status={l.status} />,
              <LeadScoreBadge score={l.score} />,
            ],
          }))}
        />
      )}
    </div>
  );
}
