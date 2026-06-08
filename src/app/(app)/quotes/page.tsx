import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listQuotes } from "@/server/services/quotes";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { QuoteStatusBadge } from "@/components/crm/status-badges";
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
import { formatCurrency } from "@/lib/utils";

export default async function QuotesPage() {
  const user = await requireUser();
  const rows = await listQuotes(user.orgId);
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="Proposals with line items, discounts and tax."
        action={
          writable ? (
            <Link href="/quotes/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> New quote
            </Link>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No quotes yet"
          description="Create a quote to send pricing to an account."
          action={
            writable ? (
              <Link href="/quotes/new" className={buttonVariants()}>
                <Plus className="h-4 w-4" /> New quote
              </Link>
            ) : null
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid until</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((q) => (
                <TableRow key={q.id}>
                  <TableCell>
                    <Link href={`/quotes/${q.id}`} className="font-medium text-accent hover:underline">
                      {q.quoteNo}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {q.accountId ? (
                      <Link href={`/accounts/${q.accountId}`} className="hover:underline">
                        {q.accountName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell><QuoteStatusBadge status={q.status} /></TableCell>
                  <TableCell className="text-muted-foreground">{q.validUntil ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(Number(q.total), q.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
