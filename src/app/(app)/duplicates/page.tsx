import Link from "next/link";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { findDuplicateAccounts, findDuplicateContacts, type DupGroup } from "@/server/services/duplicates";
import { mergeAccountsAction, mergeContactsAction } from "@/server/actions/duplicates";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "account", label: "Accounts" },
  { key: "contact", label: "Contacts" },
] as const;

export default async function DuplicatesPage({
  searchParams,
}: {
  searchParams: { entity?: string };
}) {
  const user = await requireUser();
  const entity = searchParams.entity === "contact" ? "contact" : "account";
  const writable = canWrite(user.role);
  const groups =
    entity === "account"
      ? await findDuplicateAccounts(user.orgId)
      : await findDuplicateContacts(user.orgId);
  const action = entity === "account" ? mergeAccountsAction : mergeContactsAction;

  return (
    <div className="space-y-6">
      <PageHeader title="Duplicates" description="Find and merge duplicate records." />

      <div className="flex w-fit rounded-md border bg-card p-0.5">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/duplicates?entity=${t.key}`}
            className={cn("rounded px-3 py-1.5 text-sm", entity === t.key ? "bg-muted font-medium" : "text-muted-foreground")}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No duplicates found"
          description={entity === "account" ? "No accounts share the same name." : "No contacts share the same email."}
        />
      ) : (
        <div className="space-y-4">
          {groups.map((g: DupGroup) => (
            <Card key={g.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  {g.members.length} possible duplicates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form action={action} className="space-y-3">
                  <input type="hidden" name="ids" value={g.members.map((m) => m.id).join(",")} />
                  <p className="text-xs text-muted-foreground">Choose the record to keep; the others merge into it.</p>
                  <div className="space-y-2">
                    {g.members.map((m, i) => (
                      <label key={m.id} className="flex items-center gap-2 text-sm">
                        <input type="radio" name="primary" value={m.id} defaultChecked={i === 0} required />
                        <span className="font-medium">{m.label}</span>
                        <span className="text-xs text-muted-foreground">
                          created {m.createdAt.toLocaleDateString("en-US")}
                        </span>
                      </label>
                    ))}
                  </div>
                  {writable && (
                    <Button type="submit" size="sm" variant="outline">
                      Merge into selected
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
