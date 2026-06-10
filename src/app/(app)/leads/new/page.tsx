import { requireRole } from "@/server/auth/require-user";
import { listCampaigns } from "@/server/services/campaigns";
import { PageHeader } from "@/components/crm/page-header";
import { LeadForm } from "@/components/crm/lead-form";

export default async function NewLeadPage() {
  const user = await requireRole("rep");
  const campaigns = await listCampaigns(user.orgId);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New lead" description="Capture a new lead." />
      <LeadForm campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
