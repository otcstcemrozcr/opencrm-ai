import Link from "next/link";
import { requireUser } from "@/server/auth/require-user";
import { listOpportunities } from "@/server/services/opportunities";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { StageBadge } from "@/components/crm/status-badges";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default async function OpportunitiesPage() {
  const user = await requireUser();
  const rows = await listOpportunities(user.orgId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Your active pipeline."
        action={<Badge variant="outline">Kanban view — Sprint 2</Badge>}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No opportunities yet"
          description="Convert a lead or they will appear here as your pipeline grows."
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
