import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/require-user";
import { getOpportunity } from "@/server/services/opportunities";
import { listAccounts } from "@/server/services/accounts";
import { PageHeader } from "@/components/crm/page-header";
import { OpportunityForm } from "@/components/crm/opportunity-form";

export default async function EditOpportunityPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole("rep");
  const [opp, accounts] = await Promise.all([
    getOpportunity(user.orgId, params.id),
    listAccounts(user.orgId),
  ]);
  if (!opp) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit opportunity" description={opp.name} />
      <OpportunityForm
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        opportunity={{
          id: opp.id,
          name: opp.name,
          accountId: opp.accountId,
          stage: opp.stage,
          value: String(opp.value),
          probability: opp.probability,
          expectedClose: opp.expectedClose,
          competitor: opp.competitor,
          notes: opp.notes,
          nextStep: opp.nextStep,
          lossReason: opp.lossReason,
          forecastCategory: opp.forecastCategory,
          currency: opp.currency,
        }}
      />
    </div>
  );
}
