import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listAccounts, type AccountFilters } from "@/server/services/accounts";
import { listOrgUsers } from "@/server/services/users";
import { listSavedViews } from "@/server/services/saved-views";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { FilterBar } from "@/components/crm/filter-bar";
import { SavedViews } from "@/components/crm/saved-views";
import { SelectableTable } from "@/components/crm/selectable-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

const ACCOUNT_TYPES = ["prospect", "customer", "partner", "other"];

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; sort?: string };
}) {
  const user = await requireUser();
  const [rows, owners, views] = await Promise.all([
    listAccounts(user.orgId, searchParams as AccountFilters),
    listOrgUsers(user.orgId),
    listSavedViews(user.orgId, user.id, "account"),
  ]);
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

      <SavedViews entity="account" views={views.map((v) => ({ id: v.id, name: v.name, query: v.query }))} />

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
        <SelectableTable
          entity="account"
          canWrite={writable}
          ownerOptions={owners.map((u) => ({ id: u.id, name: u.name }))}
          headers={["Name", "Type", "Industry", "Website"]}
          rows={rows.map((a) => ({
            id: a.id,
            cells: [
              <Link key="c" href={`/accounts/${a.id}`} className="font-medium text-accent hover:underline">{a.name}</Link>,
              <Badge variant="default" className="capitalize">{a.type}</Badge>,
              <span className="text-muted-foreground">{a.industry ?? "—"}</span>,
              <span className="text-muted-foreground">{a.website ?? "—"}</span>,
            ],
          }))}
        />
      )}
    </div>
  );
}
