import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listCampaigns } from "@/server/services/campaigns";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
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

const STATUS_VARIANT: Record<string, "default" | "accent" | "success"> = {
  planned: "default",
  active: "accent",
  completed: "success",
};

export default async function CampaignsPage() {
  const user = await requireUser();
  const rows = await listCampaigns(user.orgId);
  const writable = canWrite(user.role);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Marketing campaigns and their revenue impact."
        action={writable ? <Link href="/campaigns/new" className={buttonVariants()}><Plus className="h-4 w-4" /> New campaign</Link> : null}
      />

      {rows.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create a campaign to attribute leads and track ROI."
          action={writable ? <Link href="/campaigns/new" className={buttonVariants()}><Plus className="h-4 w-4" /> New campaign</Link> : null}
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead>Dates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/campaigns/${c.id}`} className="font-medium text-accent hover:underline">{c.name}</Link>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{c.type}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[c.status] ?? "default"} className="capitalize">{c.status}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{c.budget ? formatCurrency(Number(c.budget)) : "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{[c.startDate, c.endDate].filter(Boolean).join(" → ") || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
