import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { requireUser } from "@/server/auth/require-user";
import { getQuoteForPdf } from "@/server/services/quotes";
import { QuoteDocument, type QuotePdfData } from "@/server/pdf/quote-document";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser();
  const quote = await getQuoteForPdf(user.orgId, params.id);
  if (!quote) {
    return new Response("Not found", { status: 404 });
  }

  const data: QuotePdfData = {
    orgName: quote.orgName,
    quoteNo: quote.quoteNo,
    status: quote.status,
    currency: quote.currency,
    accountName: quote.accountName,
    validUntil: quote.validUntil,
    notes: quote.notes,
    subtotal: String(quote.subtotal),
    discount: String(quote.discount),
    tax: String(quote.tax),
    total: String(quote.total),
    lines: quote.lines.map((l) => ({
      name: l.name,
      description: l.description,
      kind: l.kind,
      qty: String(l.qty),
      unitPrice: String(l.unitPrice),
      discount: String(l.discount),
      taxRate: String(l.taxRate),
      lineTotal: String(l.lineTotal),
    })),
  };

  const element = createElement(QuoteDocument, { data }) as Parameters<
    typeof renderToBuffer
  >[0];
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${quote.quoteNo}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
