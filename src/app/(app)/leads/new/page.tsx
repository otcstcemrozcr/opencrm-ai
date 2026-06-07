import { requireRole } from "@/server/auth/require-user";
import { PageHeader } from "@/components/crm/page-header";
import { LeadForm } from "@/components/crm/lead-form";

export default async function NewLeadPage() {
  await requireRole("rep");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New lead" description="Capture a new lead." />
      <LeadForm />
    </div>
  );
}
