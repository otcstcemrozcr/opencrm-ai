import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/require-user";
import { getProduct } from "@/server/services/products";
import { PageHeader } from "@/components/crm/page-header";
import { ProductForm } from "@/components/crm/product-form";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const user = await requireRole("rep");
  const product = await getProduct(user.orgId, params.id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit product" description={product.name} />
      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          kind: product.kind,
          unitPrice: product.unitPrice,
          currency: product.currency,
          taxRate: product.taxRate,
          description: product.description,
          active: product.active,
        }}
      />
    </div>
  );
}
