import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/require-user";
import { getCampaign } from "@/server/services/campaigns";
import { PageHeader } from "@/components/crm/page-header";
import { CampaignForm } from "@/components/crm/campaign-form";

export default async function EditCampaignPage({ params }: { params: { id: string } }) {
  const user = await requireRole("rep");
  const campaign = await getCampaign(user.orgId, params.id);
  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit campaign" description={campaign.name} />
      <CampaignForm
        campaign={{
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          budget: campaign.budget,
          description: campaign.description,
        }}
      />
    </div>
  );
}
