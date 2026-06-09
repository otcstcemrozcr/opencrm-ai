import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { getAccount } from "@/server/services/accounts";
import { listContactsByAccount } from "@/server/services/contacts";
import { listOpportunitiesByAccount } from "@/server/services/opportunities";
import { listNotes } from "@/server/services/notes";
import { removeAccount } from "@/server/actions/accounts";
import { PageHeader } from "@/components/crm/page-header";
import { NotePanel } from "@/components/crm/note-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const account = await getAccount(user.orgId, params.id);
  if (!account) notFound();

  const [contacts, opps, notes] = await Promise.all([
    listContactsByAccount(user.orgId, account.id),
    listOpportunitiesByAccount(user.orgId, account.id),
    listNotes(user.orgId, "account", account.id),
  ]);
  const parent = account.parentAccountId
    ? await getAccount(user.orgId, account.parentAccountId)
    : null;
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title={account.name}
        description={account.industry ?? undefined}
        action={
          writable ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/accounts/${account.id}/edit`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <form action={removeAccount}>
                <input type="hidden" name="id" value={account.id} />
                <Button variant="destructive" type="submit">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </form>
            </div>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: details */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Field label="Name 2" value={account.name2} />
            <Field label="Type" value={<span className="capitalize">{account.type}</span>} />
            <Field label="Industry" value={account.industry} />
            <Field
              label="Website"
              value={
                account.website ? (
                  <a
                    href={account.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:underline"
                  >
                    {account.website}
                  </a>
                ) : null
              }
            />
            <Field label="Phone" value={account.phone} />
            <Field
              label="Employees"
              value={account.employees !== null ? account.employees.toLocaleString("en-US") : null}
            />
            <Field
              label="Annual revenue"
              value={account.annualRevenue ? formatCurrency(Number(account.annualRevenue)) : null}
            />
            <Field label="Tax number" value={account.taxNumber} />
            <Field label="Tax office" value={account.taxOffice} />
            <Field label="Status" value={<span className="capitalize">{account.status}</span>} />
            <Field label="Rating" value={account.rating ? <span className="capitalize">{account.rating}</span> : null} />
            <Field label="Currency" value={account.currency} />
            <Field label="Payment terms" value={account.paymentTerms} />
            <Field label="Credit limit" value={account.creditLimit ? formatCurrency(Number(account.creditLimit), account.currency) : null} />
            <Field
              label="Parent account"
              value={parent ? <Link href={`/accounts/${parent.id}`} className="text-accent hover:underline">{parent.name}</Link> : null}
            />
            <Field
              label="Address"
              value={
                [
                  account.addressLine,
                  account.street2,
                  [account.postalCode, account.city].filter(Boolean).join(" "),
                  account.region,
                  account.country,
                ]
                  .filter(Boolean)
                  .join(", ") || null
              }
            />
            {account.description && (
              <Field
                label="Description"
                value={<span className="whitespace-pre-wrap">{account.description}</span>}
              />
            )}
          </CardContent>
        </Card>

        {/* Right: related */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Contacts</CardTitle>
              {writable && (
                <Link
                  href={`/contacts/new?accountId=${account.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Plus className="h-4 w-4" /> Add
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts yet.</p>
              ) : (
                <ul className="divide-y">
                  {contacts.map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-2">
                      <Link href={`/contacts/${c.id}`} className="text-sm font-medium text-accent hover:underline">
                        {c.name}
                      </Link>
                      <span className="text-sm text-muted-foreground">{c.title ?? c.email ?? ""}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Opportunities</CardTitle>
              {writable && (
                <Link
                  href={`/opportunities/new?accountId=${account.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <Plus className="h-4 w-4" /> Add
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {opps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No opportunities yet.</p>
              ) : (
                <ul className="divide-y">
                  {opps.map((o) => (
                    <li key={o.id} className="flex items-center justify-between py-2">
                      <Link href={`/opportunities/${o.id}`} className="text-sm font-medium text-accent hover:underline">
                        {o.name}
                      </Link>
                      <span className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="accent">{o.stage}</Badge>
                        {formatCurrency(Number(o.value))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <NotePanel
            relatedType="account"
            relatedId={account.id}
            canWrite={writable}
            items={notes.map((n) => ({
              id: n.id,
              body: n.body,
              authorName: n.authorName,
              createdAt: n.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode | null | undefined;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value ? value : <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
