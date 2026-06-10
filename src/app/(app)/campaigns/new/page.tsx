import { requireRole } from "@/server/auth/require-user";
import { PageHeader } from "@/components/crm/page-header";
import { CampaignForm } from "@/components/crm/campaign-form";

export default async function NewCampaignPage() {
  await requireRole("rep");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New campaign" description="Plan a marketing campaign." />
      <CampaignForm />
    </div>
  );
}
