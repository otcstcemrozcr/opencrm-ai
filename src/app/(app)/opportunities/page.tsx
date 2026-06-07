import Link from "next/link";
import { Plus, LayoutGrid, List } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listOpportunities } from "@/server/services/opportunities";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { StageBadge } from "@/components/crm/status-badges";
import { KanbanBoard } from "@/components/crm/kanban-board";
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
import { cn, formatCurrency } from "@/lib/utils";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const user = await requireUser();
  const rows = await listOpportunities(user.orgId);
  const writable = canWrite(user.role);
  const view = searchParams.view === "list" ? "list" : "kanban";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Your active pipeline."
        action={
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border bg-card p-0.5">
              <Link
                href="/opportunities?view=kanban"
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm",
                  view === "kanban" ? "bg-muted font-medium" : "text-muted-foreground"
                )}
              >
                <LayoutGrid className="h-4 w-4" /> Kanban
              </Link>
              <Link
                href="/opportunities?view=list"
                className={cn(
                  "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm",
                  view === "list" ? "bg-muted font-medium" : "text-muted-foreground"
                )}
              >
                <List className="h-4 w-4" /> List
              </Link>
            </div>
            {writable && (
              <Link href="/opportunities/new" className={buttonVariants()}>
                <Plus className="h-4 w-4" /> New
              </Link>
            )}
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No opportunities yet"
          description="Create one or convert a lead to build your pipeline."
          action={
            writable ? (
              <Link href="/opportunities/new" className={buttonVariants()}>
                <Plus className="h-4 w-4" /> New opportunity
              </Link>
            ) : null
          }
        />
      ) : view === "kanban" ? (
        <KanbanBoard
          canWrite={writable}
          items={rows.map((o) => ({
            id: o.id,
            name: o.name,
            accountName: o.accountName,
            value: String(o.value),
            probability: o.probability,
            stage: o.stage,
          }))}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Prob.</TableHead>
                <TableHead>Close</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/opportunities/${o.id}`} className="font-medium text-accent hover:underline">
                      {o.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {o.accountId ? (
                      <Link href={`/accounts/${o.accountId}`} className="hover:underline">
                        {o.accountName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell><StageBadge stage={o.stage} /></TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(o.value))}</TableCell>
                  <TableCell className="text-right tabular-nums">{o.probability}%</TableCell>
                  <TableCell className="text-muted-foreground">{o.expectedClose ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
