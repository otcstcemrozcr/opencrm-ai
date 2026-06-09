import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listLeads, type LeadFilters } from "@/server/services/leads";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { FilterBar } from "@/components/crm/filter-bar";
import { LeadStatusBadge } from "@/components/crm/status-badges";

const LEAD_STATUSES = ["new", "working", "qualified", "unqualified", "converted"];
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; sort?: string };
}) {
  const user = await requireUser();
  const rows = await listLeads(user.orgId, searchParams as LeadFilters);
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Inbound and prospected leads to qualify."
        action={
          writable ? (
            <Link href="/leads/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> New lead
            </Link>
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
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Link href={`/leads/${l.id}`} className="font-medium text-accent hover:underline">
                      {l.company}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.contactName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{l.source ?? "—"}</TableCell>
                  <TableCell><LeadStatusBadge status={l.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{l.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
