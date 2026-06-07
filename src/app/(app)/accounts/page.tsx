import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listAccounts } from "@/server/services/accounts";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
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

export default async function AccountsPage() {
  const user = await requireUser();
  const rows = await listAccounts(user.orgId);
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Companies you sell to."
        action={
          writable ? (
            <Link href="/accounts/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> New account
            </Link>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          description="Create your first account to start building your customer base."
          action={
            writable ? (
              <Link href="/accounts/new" className={buttonVariants()}>
                <Plus className="h-4 w-4" /> New account
              </Link>
            ) : null
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Website</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={`/accounts/${a.id}`} className="font-medium text-accent hover:underline">
                      {a.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.industry ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{a.website ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
