import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { getProduct } from "@/server/services/products";
import { removeProduct } from "@/server/actions/products";
import { PageHeader } from "@/components/crm/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const product = await getProduct(user.orgId, params.id);
  if (!product) notFound();
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={product.sku ? `SKU ${product.sku}` : undefined}
        action={
          writable ? (
            <div className="flex items-center gap-2">
              <Link href={`/products/${product.id}/edit`} className={buttonVariants({ variant: "outline" })}>
                <Pencil className="h-4 w-4" /> Edit
              </Link>
              <form action={removeProduct}>
                <input type="hidden" name="id" value={product.id} />
                <Button variant="destructive" type="submit"><Trash2 className="h-4 w-4" /> Delete</Button>
              </form>
            </div>
          ) : null
        }
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <Field label="Kind" value={<span className="capitalize">{product.kind}</span>} />
          <Field label="Status" value={product.active ? <Badge variant="success">Active</Badge> : <Badge>Inactive</Badge>} />
          <Field label="Unit price" value={formatCurrency(Number(product.unitPrice), product.currency)} />
          <Field label="Tax rate" value={`${Number(product.taxRate)}%`} />
          {product.description && (
            <div className="sm:col-span-2">
              <Field label="Description" value={<span className="whitespace-pre-wrap">{product.description}</span>} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode | null | undefined }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5">{value ? value : <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}
