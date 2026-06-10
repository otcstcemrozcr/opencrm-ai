import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/require-user";
import { getLead } from "@/server/services/leads";
import { PageHeader } from "@/components/crm/page-header";
import { LeadForm } from "@/components/crm/lead-form";

export default async function EditLeadPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole("rep");
  const lead = await getLead(user.orgId, params.id);
  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit lead" description={lead.company} />
      <LeadForm
        lead={{
          id: lead.id,
          company: lead.company,
          contactName: lead.contactName,
          email: lead.email,
          phone: lead.phone,
          linkedin: lead.linkedin,
          source: lead.source,
          industry: lead.industry,
          status: lead.status,
          score: lead.score,
          rating: lead.rating,
          estimatedValue: lead.estimatedValue,
          utmSource: lead.utmSource,
          utmMedium: lead.utmMedium,
          utmCampaign: lead.utmCampaign,
          doNotContact: lead.doNotContact,
        }}
      />
    </div>
  );
}
