import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/require-user";
import { getQuote } from "@/server/services/quotes";
import { listAccounts } from "@/server/services/accounts";
import { listOpportunities } from "@/server/services/opportunities";
import { PageHeader } from "@/components/crm/page-header";
import { QuoteForm } from "@/components/crm/quote-form";

export default async function EditQuotePage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole("rep");
  const [quote, accounts, opps] = await Promise.all([
    getQuote(user.orgId, params.id),
    listAccounts(user.orgId),
    listOpportunities(user.orgId),
  ]);
  if (!quote) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={`Edit ${quote.quoteNo}`} />
      <QuoteForm
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        opportunities={opps.map((o) => ({ id: o.id, name: o.name }))}
        quote={{
          id: quote.id,
          accountId: quote.accountId,
          opportunityId: quote.opportunityId,
          status: quote.status,
          currency: quote.currency,
          notes: quote.notes,
          validUntil: quote.validUntil,
          lines: quote.lines.map((l) => ({
            kind: l.kind,
            name: l.name,
            description: l.description ?? "",
            qty: Number(l.qty),
            unitPrice: Number(l.unitPrice),
            discount: Number(l.discount),
            taxRate: Number(l.taxRate),
          })),
        }}
      />
    </div>
  );
}
