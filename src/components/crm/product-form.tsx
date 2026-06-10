"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveProduct, type FormState } from "@/server/actions/products";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  product?: {
    id: string;
    name: string;
    sku: string | null;
    kind: "product" | "service";
    unitPrice: string;
    currency: string;
    taxRate: string;
    description: string | null;
    active: boolean;
  };
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
    </Button>
  );
}

export function ProductForm({ product }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveProduct, {});
  const isEdit = Boolean(product);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          {product && <input type="hidden" name="id" value={product.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name" defaultValue={product?.name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={product?.sku ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="kind">Kind</Label>
              <Select id="kind" name="kind" defaultValue={product?.kind ?? "product"}>
                <option value="product">Product</option>
                <option value="service">Service</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit price</Label>
              <Input id="unitPrice" name="unitPrice" type="number" min={0} step="0.01" defaultValue={product?.unitPrice ?? "0"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue={product?.currency ?? "USD"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax %</Label>
              <Input id="taxRate" name="taxRate" type="number" min={0} max={100} step="0.01" defaultValue={product?.taxRate ?? "0"} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={product?.description ?? ""} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} />
            Active (available in quote catalog)
          </label>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex items-center gap-2">
            <SubmitButton isEdit={isEdit} />
            <Link href={product ? `/products/${product.id}` : "/products"} className={buttonVariants({ variant: "outline" })}>
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
