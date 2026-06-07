import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listLeads } from "@/server/services/leads";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { LeadStatusBadge } from "@/components/crm/status-badges";
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

export default async function LeadsPage() {
  const user = await requireUser();
  const rows = await listLeads(user.orgId);
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

      {rows.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Add a lead to start the revenue loop."
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
