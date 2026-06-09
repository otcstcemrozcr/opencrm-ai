import { requireRole } from "@/server/auth/require-user";
import { listAccounts } from "@/server/services/accounts";
import { PageHeader } from "@/components/crm/page-header";
import { AccountForm } from "@/components/crm/account-form";

export default async function NewAccountPage() {
  const user = await requireRole("rep");
  const all = await listAccounts(user.orgId);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New account" description="Add a company to your CRM." />
      <AccountForm parentOptions={all.map((a) => ({ id: a.id, name: a.name }))} />
    </div>
  );
}
