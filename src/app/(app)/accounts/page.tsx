import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listAccounts, type AccountFilters } from "@/server/services/accounts";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { FilterBar } from "@/components/crm/filter-bar";

const ACCOUNT_TYPES = ["prospect", "customer", "partner", "other"];
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

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; sort?: string };
}) {
  const user = await requireUser();
  const rows = await listAccounts(user.orgId, searchParams as AccountFilters);
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

      <FilterBar
        searchPlaceholder="Search accounts…"
        filters={[{ name: "type", label: "Type", options: ACCOUNT_TYPES.map((t) => ({ value: t, label: t })) }]}
        sorts={[
          { value: "name_asc", label: "Name (A→Z)" },
          { value: "created_asc", label: "Oldest" },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No accounts found"
          description="No accounts match your filters, or none exist yet."
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
