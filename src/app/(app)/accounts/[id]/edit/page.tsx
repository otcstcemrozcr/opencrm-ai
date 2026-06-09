import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/require-user";
import { getAccount, listAccounts } from "@/server/services/accounts";
import { PageHeader } from "@/components/crm/page-header";
import { AccountForm } from "@/components/crm/account-form";

export default async function EditAccountPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole("rep");
  const [account, all] = await Promise.all([
    getAccount(user.orgId, params.id),
    listAccounts(user.orgId),
  ]);
  if (!account) notFound();
  const parentOptions = all
    .filter((a) => a.id !== account.id)
    .map((a) => ({ id: a.id, name: a.name }));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit account" description={account.name} />
      <AccountForm
        parentOptions={parentOptions}
        account={{
          id: account.id,
          name: account.name,
          name2: account.name2,
          type: account.type,
          industry: account.industry,
          website: account.website,
          phone: account.phone,
          employees: account.employees,
          annualRevenue: account.annualRevenue,
          taxNumber: account.taxNumber,
          taxOffice: account.taxOffice,
          currency: account.currency,
          paymentTerms: account.paymentTerms,
          creditLimit: account.creditLimit,
          status: account.status,
          rating: account.rating,
          parentAccountId: account.parentAccountId,
          addressLine: account.addressLine,
          street2: account.street2,
          postalCode: account.postalCode,
          city: account.city,
          region: account.region,
          country: account.country,
          description: account.description,
        }}
      />
    </div>
  );
}
