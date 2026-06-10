"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Trash2, Plus } from "lucide-react";
import { saveQuote, type FormState } from "@/server/actions/quotes";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type Line = {
  kind: "product" | "service";
  name: string;
  description: string;
  qty: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
};

type Option = { id: string; name: string };
type ProductOption = { id: string; name: string; kind: "product" | "service"; unitPrice: string; taxRate: string };

type Props = {
  accounts: Option[];
  opportunities: Option[];
  products?: ProductOption[];
  quote?: {
    id: string;
    accountId: string | null;
    opportunityId: string | null;
    status: "draft" | "sent" | "accepted" | "rejected" | "expired";
    currency: string;
    notes: string | null;
    validUntil: string | null;
    lines: Line[];
  };
  defaultAccountId?: string;
  defaultOpportunityId?: string;
};

const STATUSES = ["draft", "sent", "accepted", "rejected", "expired"] as const;
const emptyLine: Line = { kind: "product", name: "", description: "", qty: 1, unitPrice: 0, discount: 0, taxRate: 0 };

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create quote"}
    </Button>
  );
}

export function QuoteForm({
  accounts,
  opportunities,
  products = [],
  quote,
  defaultAccountId,
  defaultOpportunityId,
}: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveQuote, {});
  const [lines, setLines] = useState<Line[]>(quote?.lines.length ? quote.lines : [{ ...emptyLine }]);
  const isEdit = Boolean(quote);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }
  function addLine() {
    setLines((prev) => [...prev, { ...emptyLine }]);
  }
  function addFromCatalog(productId: string) {
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    setLines((prev) => [
      ...prev,
      { kind: p.kind, name: p.name, description: "", qty: 1, unitPrice: Number(p.unitPrice), discount: 0, taxRate: Number(p.taxRate) },
    ]);
  }
  function removeLine(i: number) {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));
  }

  // Live totals (mirrors server computeTotals).
  let subtotal = 0,
    discount = 0,
    tax = 0;
  for (const l of lines) {
    const gross = (Number(l.qty) || 0) * (Number(l.unitPrice) || 0);
    const lineTotal = Math.max(gross - (Number(l.discount) || 0), 0);
    subtotal += gross;
    discount += Number(l.discount) || 0;
    tax += (lineTotal * (Number(l.taxRate) || 0)) / 100;
  }
  const total = subtotal - discount + tax;

  return (
    <form action={formAction} className="space-y-6">
      {quote && <input type="hidden" name="id" value={quote.id} />}
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quote details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="accountId">Account</Label>
            <Select id="accountId" name="accountId" defaultValue={quote?.accountId ?? defaultAccountId ?? ""}>
              <option value="">— None —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="opportunityId">Opportunity</Label>
            <Select id="opportunityId" name="opportunityId" defaultValue={quote?.opportunityId ?? defaultOpportunityId ?? ""}>
              <option value="">— None —</option>
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={quote?.status ?? "draft"}>
              {STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue={quote?.currency ?? "USD"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="validUntil">Valid until</Label>
              <Input id="validUntil" name="validUntil" type="date" defaultValue={quote?.validUntil ?? ""} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Line items</CardTitle>
          <div className="flex items-center gap-2">
            {products.length > 0 && (
              <Select
                value=""
                onChange={(e) => { if (e.target.value) { addFromCatalog(e.target.value); e.target.value = ""; } }}
                className="h-9 w-48"
              >
                <option value="">+ From catalog…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            )}
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="h-4 w-4" /> Add line
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {lines.map((l, i) => {
            const gross = (Number(l.qty) || 0) * (Number(l.unitPrice) || 0);
            const lineTotal = Math.max(gross - (Number(l.discount) || 0), 0);
            return (
              <div key={i} className="rounded-md border p-3">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 sm:col-span-2">
                    <Label className="text-xs">Kind</Label>
                    <Select value={l.kind} onChange={(e) => updateLine(i, { kind: e.target.value as Line["kind"] })}>
                      <option value="product">Product</option>
                      <option value="service">Service</option>
                    </Select>
                  </div>
                  <div className="col-span-12 sm:col-span-4">
                    <Label className="text-xs">Name</Label>
                    <Input value={l.name} onChange={(e) => updateLine(i, { name: e.target.value })} placeholder="Item" />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" step="0.01" value={l.qty} onChange={(e) => updateLine(i, { qty: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs">Unit price</Label>
                    <Input type="number" step="0.01" value={l.unitPrice} onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <Label className="text-xs">Discount</Label>
                    <Input type="number" step="0.01" value={l.discount} onChange={(e) => updateLine(i, { discount: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-6 sm:col-span-2">
                    <Label className="text-xs">Tax %</Label>
                    <Input type="number" step="0.01" value={l.taxRate} onChange={(e) => updateLine(i, { taxRate: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-6 sm:col-span-9 flex items-end">
                    <Input value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} placeholder="Description (optional)" />
                  </div>
                  <div className="col-span-12 sm:col-span-1 flex items-end justify-end gap-2">
                    <span className="hidden text-sm tabular-nums text-muted-foreground sm:inline">
                      {formatCurrency(lineTotal)}
                    </span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(i)} aria-label="Remove line">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-sm">
              <Row label="Subtotal" value={formatCurrency(subtotal)} />
              <Row label="Discount" value={`- ${formatCurrency(discount)}`} />
              <Row label="Tax" value={formatCurrency(tax)} />
              <div className="border-t pt-1">
                <Row label="Total" value={formatCurrency(total)} bold />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" defaultValue={quote?.notes ?? ""} placeholder="Terms, delivery, etc." />
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="flex items-center gap-2">
        <SubmitButton isEdit={isEdit} />
        <Link href={quote ? `/quotes/${quote.id}` : "/quotes"} className={buttonVariants({ variant: "outline" })}>
          Cancel
        </Link>
      </div>
    </form>
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
