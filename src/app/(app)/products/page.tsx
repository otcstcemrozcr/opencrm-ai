import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listProducts, type ProductFilters } from "@/server/services/products";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { FilterBar } from "@/components/crm/filter-bar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { q?: string; active?: string; sort?: string };
}) {
  const user = await requireUser();
  const rows = await listProducts(user.orgId, searchParams as ProductFilters);
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Your price book. Add your own products and services."
        action={
          writable ? (
            <Link href="/products/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> New product
            </Link>
          ) : null
        }
      />

      <FilterBar
        searchPlaceholder="Search products…"
        filters={[{ name: "active", label: "Status", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] }]}
        sorts={[
          { value: "name_asc", label: "Name (A→Z)" },
          { value: "price_desc", label: "Price (high→low)" },
          { value: "price_asc", label: "Price (low→high)" },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Create your first product or service to use in quotes."
          action={writable ? <Link href="/products/new" className={buttonVariants()}><Plus className="h-4 w-4" /> New product</Link> : null}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Tax %</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/products/${p.id}`} className="font-medium text-accent hover:underline">{p.name}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.sku ?? "—"}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{p.kind}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCurrency(Number(p.unitPrice), p.currency)}</TableCell>
                  <TableCell className="text-right tabular-nums">{Number(p.taxRate)}%</TableCell>
                  <TableCell>
                    {p.active ? <Badge variant="success">Active</Badge> : <Badge variant="default">Inactive</Badge>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
