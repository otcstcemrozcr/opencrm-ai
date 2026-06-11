import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/require-user";
import { PageHeader } from "@/components/crm/page-header";
import { CustomFieldForm } from "@/components/crm/custom-field-form";

export default async function NewCustomFieldPage() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New custom field" description="Add an extra field to a record type." />
      <CustomFieldForm />
    </div>
  );
}
