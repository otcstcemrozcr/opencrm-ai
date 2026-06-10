import { requireRole } from "@/server/auth/require-user";
import { PageHeader } from "@/components/crm/page-header";
import { ProductForm } from "@/components/crm/product-form";

export default async function NewProductPage() {
  await requireRole("rep");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New product" description="Add a product or service to your price book." />
      <ProductForm />
    </div>
  );
}
