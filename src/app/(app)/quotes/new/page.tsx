import { requireRole } from "@/server/auth/require-user";
import { listAccounts } from "@/server/services/accounts";
import { listOpportunities } from "@/server/services/opportunities";
import { listActiveProducts } from "@/server/services/products";
import { PageHeader } from "@/components/crm/page-header";
import { QuoteForm } from "@/components/crm/quote-form";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: { accountId?: string; opportunityId?: string };
}) {
  const user = await requireRole("rep");
  const [accounts, opps, products] = await Promise.all([
    listAccounts(user.orgId),
    listOpportunities(user.orgId),
    listActiveProducts(user.orgId),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="New quote" description="Build a quote with line items." />
      <QuoteForm
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        opportunities={opps.map((o) => ({ id: o.id, name: o.name }))}
        products={products.map((p) => ({ id: p.id, name: p.name, kind: p.kind, unitPrice: p.unitPrice, taxRate: p.taxRate }))}
        defaultAccountId={searchParams.accountId}
        defaultOpportunityId={searchParams.opportunityId}
      />
    </div>
  );
}
