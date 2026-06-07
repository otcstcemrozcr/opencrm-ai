import { requireRole } from "@/server/auth/require-user";
import { listAccounts } from "@/server/services/accounts";
import { PageHeader } from "@/components/crm/page-header";
import { OpportunityForm } from "@/components/crm/opportunity-form";

export default async function NewOpportunityPage({
  searchParams,
}: {
  searchParams: { accountId?: string };
}) {
  const user = await requireRole("rep");
  const accounts = await listAccounts(user.orgId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New opportunity" description="Add a deal to your pipeline." />
      <OpportunityForm
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        defaultAccountId={searchParams.accountId}
      />
    </div>
  );
}
