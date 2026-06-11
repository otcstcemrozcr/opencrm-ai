import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/server/auth/require-user";
import { getFieldDef } from "@/server/services/custom-fields";
import { PageHeader } from "@/components/crm/page-header";
import { CustomFieldForm } from "@/components/crm/custom-field-form";

export default async function EditCustomFieldPage({ params }: { params: { id: string } }) {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/dashboard");

  const def = await getFieldDef(me.orgId, params.id);
  if (!def) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit custom field" description={def.label} />
      <CustomFieldForm
        field={{
          id: def.id,
          entity: def.entity,
          key: def.key,
          label: def.label,
          type: def.type,
          options: def.options ? (JSON.parse(def.options) as string[]) : [],
          required: def.required,
          sortOrder: def.sortOrder,
          active: def.active,
        }}
      />
    </div>
  );
}
