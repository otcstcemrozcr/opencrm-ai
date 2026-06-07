import { requireRole } from "@/server/auth/require-user";
import { listAccounts } from "@/server/services/accounts";
import { PageHeader } from "@/components/crm/page-header";
import { ContactForm } from "@/components/crm/contact-form";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: { accountId?: string };
}) {
  const user = await requireRole("rep");
  const accounts = await listAccounts(user.orgId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New contact" description="Add a person to your CRM." />
      <ContactForm
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        defaultAccountId={searchParams.accountId}
      />
    </div>
  );
}
