import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, FileDown, Copy } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { getQuote, listQuoteVersions } from "@/server/services/quotes";
import { removeQuote, changeQuoteStatus, newQuoteVersion } from "@/server/actions/quotes";
import { PageHeader } from "@/components/crm/page-header";
import { QuoteStatusBadge } from "@/components/crm/status-badges";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;

export default async function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const quote = await getQuote(user.orgId, params.id);
  if (!quote) notFound();

  const writable = canWrite(user.role);
  const cur = quote.currency;
  const versions = await listQuoteVersions(user.orgId, quote.quoteNo);

  return (
    <div className="space-y-6">
      <PageHeader
        title={quote.quoteNo}
        description={`Version ${quote.version}${quote.accountName ? ` · ${quote.accountName}` : ""}`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/quotes/${quote.id}/pdf`} className={buttonVariants({ variant: "outline" })}>
              <FileDown className="h-4 w-4" /> PDF
            </Link>
            {writable && (
              <>
                <form action={newQuoteVersion}>
                  <input type="hidden" name="id" value={quote.id} />
                  <Button variant="outline" type="submit">
                    <Copy className="h-4 w-4" /> New version
                  </Button>
                </form>
                <Link href={`/quotes/${quote.id}/edit`} className={buttonVariants({ variant: "outline" })}>
                  <Pencil className="h-4 w-4" /> Edit
                </Link>
                <form action={removeQuote}>
                  <input type="hidden" name="id" value={quote.id} />
                  <Button variant="destructive" type="submit">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </form>
              </>
            )}
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <QuoteStatusBadge status={quote.status} />
        {quote.validUntil && (
          <span className="text-sm text-muted-foreground">Valid until {quote.validUntil}</span>
        )}
        {writable && (
          <form action={changeQuoteStatus} className="ml-auto flex items-center gap-2">
            <input type="hidden" name="id" value={quote.id} />
            <Select name="status" defaultValue={quote.status} className="h-9 w-36">
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </Select>
            <Button type="submit" variant="outline" size="sm">Update status</Button>
          </form>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Disc.</TableHead>
                <TableHead className="text-right">Tax %</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quote.lines.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="font-medium">{l.name}</div>
                    {l.description && <div className="text-xs text-muted-foreground">{l.description}</div>}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{l.kind}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(l.qty)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(l.unitPrice), cur)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(l.discount), cur)}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(l.taxRate)}%</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(l.lineTotal), cur)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <Row label="Subtotal" value={formatCurrency(Number(quote.subtotal), cur)} />
              <Row label="Discount" value={`- ${formatCurrency(Number(quote.discount), cur)}`} />
              <Row label="Tax" value={formatCurrency(Number(quote.tax), cur)} />
              <div className="border-t pt-1">
                <Row label="Total" value={formatCurrency(Number(quote.total), cur)} bold />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {quote.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{quote.notes}</p>
          </CardContent>
        </Card>
      )}

      {versions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {versions.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/quotes/${v.id}`} className={v.id === quote.id ? "font-semibold" : "text-accent hover:underline"}>
                    Version {v.version}{v.id === quote.id ? " (current)" : ""}
                  </Link>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <QuoteStatusBadge status={v.status} />
                    <span className="tabular-nums">{formatCurrency(Number(v.total), v.currency)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
