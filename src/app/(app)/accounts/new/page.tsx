import { requireRole } from "@/server/auth/require-user";
import { PageHeader } from "@/components/crm/page-header";
import { AccountForm } from "@/components/crm/account-form";

export default async function NewAccountPage() {
  await requireRole("rep");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New account" description="Add a company to your CRM." />
      <AccountForm />
    </div>
  );
}
