import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/require-user";
import { getAccount } from "@/server/services/accounts";
import { PageHeader } from "@/components/crm/page-header";
import { AccountForm } from "@/components/crm/account-form";

export default async function EditAccountPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole("rep");
  const account = await getAccount(user.orgId, params.id);
  if (!account) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit account" description={account.name} />
      <AccountForm
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
