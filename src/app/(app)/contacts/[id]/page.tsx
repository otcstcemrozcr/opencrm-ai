import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { getContact } from "@/server/services/contacts";
import { getAccount } from "@/server/services/accounts";
import { listNotes } from "@/server/services/notes";
import { removeContact } from "@/server/actions/contacts";
import { PageHeader } from "@/components/crm/page-header";
import { NotePanel } from "@/components/crm/note-panel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ContactDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const contact = await getContact(user.orgId, params.id);
  if (!contact) notFound();

  const account = contact.accountId
    ? await getAccount(user.orgId, contact.accountId)
    : null;
  const writable = canWrite(user.role);
  const notes = await listNotes(user.orgId, "contact", contact.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={contact.name}
        description={contact.title ?? undefined}
        action={
          writable ? (
            <div className="flex items-center gap-2">
              <Link
                href={`/contacts/${contact.id}/edit`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <form action={removeContact}>
                <input type="hidden" name="id" value={contact.id} />
                <Button variant="destructive" type="submit">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </form>
            </div>
          ) : null
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Field label="Account" value={
            account ? (
              <Link href={`/accounts/${account.id}`} className="text-accent hover:underline">
                {account.name}
              </Link>
            ) : null
          } />
          <Field label="Department" value={contact.department} />
          <Field label="Email" value={contact.email} />
          <Field label="Secondary email" value={contact.secondaryEmail} />
          <Field label="Phone" value={contact.phone} />
          <Field label="Mobile" value={contact.mobile} />
          {contact.doNotContact && (
            <Field label="Compliance" value={<span className="text-destructive">Do not contact</span>} />
          )}
          <Field label="LinkedIn" value={
            contact.linkedin ? (
              <a href={contact.linkedin} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Profile
              </a>
            ) : null
          } />
        </CardContent>
      </Card>

      <div className="max-w-2xl">
        <NotePanel
          relatedType="contact"
          relatedId={contact.id}
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
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value ? value : <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
