import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listContacts, type ContactFilters } from "@/server/services/contacts";
import { listOrgUsers } from "@/server/services/users";
import { listSavedViews } from "@/server/services/saved-views";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { FilterBar } from "@/components/crm/filter-bar";
import { SavedViews } from "@/components/crm/saved-views";
import { SelectableTable } from "@/components/crm/selectable-table";
import { buttonVariants } from "@/components/ui/button";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string };
}) {
  const user = await requireUser();
  const [rows, owners, views] = await Promise.all([
    listContacts(user.orgId, searchParams as ContactFilters),
    listOrgUsers(user.orgId),
    listSavedViews(user.orgId, user.id, "contact"),
  ]);
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

      <SavedViews entity="contact" views={views.map((v) => ({ id: v.id, name: v.name, query: v.query }))} />

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
        <SelectableTable
          entity="contact"
          canWrite={writable}
          ownerOptions={owners.map((u) => ({ id: u.id, name: u.name }))}
          headers={["Name", "Title", "Account", "Email"]}
          rows={rows.map((c) => ({
            id: c.id,
            cells: [
              <Link key="c" href={`/contacts/${c.id}`} className="font-medium text-accent hover:underline">{c.name}</Link>,
              <span className="text-muted-foreground">{c.title ?? "—"}</span>,
              c.accountId ? (
                <Link href={`/accounts/${c.accountId}`} className="text-muted-foreground hover:underline">{c.accountName}</Link>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
              <span className="text-muted-foreground">{c.email ?? "—"}</span>,
            ],
          }))}
        />
      )}
    </div>
  );
}
