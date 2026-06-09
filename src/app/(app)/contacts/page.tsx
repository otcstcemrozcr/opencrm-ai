import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listContacts, type ContactFilters } from "@/server/services/contacts";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { FilterBar } from "@/components/crm/filter-bar";
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

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string };
}) {
  const user = await requireUser();
  const rows = await listContacts(user.orgId, searchParams as ContactFilters);
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="People at your accounts."
        action={
          writable ? (
            <Link href="/contacts/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> New contact
            </Link>
          ) : null
        }
      />

      <FilterBar
        searchPlaceholder="Search name or email…"
        sorts={[{ value: "name_asc", label: "Name (A→Z)" }]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No contacts found"
          description="No contacts match your filters, or none exist yet."
          action={
            writable ? (
              <Link href="/contacts/new" className={buttonVariants()}>
                <Plus className="h-4 w-4" /> New contact
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
                <TableHead>Title</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/contacts/${c.id}`} className="font-medium text-accent hover:underline">
                      {c.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.title ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.accountId ? (
                      <Link href={`/accounts/${c.accountId}`} className="hover:underline">
                        {c.accountName}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
