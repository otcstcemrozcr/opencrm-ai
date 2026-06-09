import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/require-user";
import { listAuditLogs } from "@/server/services/audit";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ACTION_VARIANT: Record<string, "default" | "accent" | "success" | "warning" | "destructive"> = {
  create: "success",
  update: "accent",
  delete: "destructive",
  convert: "accent",
  status: "warning",
};

export default async function AuditPage() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  const rows = await listAuditLogs(user.orgId);

  return (
    <div className="space-y-6">
      <PageHeader title="Audit log" description="Who changed what, and when. Admin only." />

      {rows.length === 0 ? (
        <EmptyState title="No audit entries yet" description="Actions like deletes, conversions and status changes will appear here." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {r.createdAt.toLocaleString("en-US")}
                  </TableCell>
                  <TableCell>{r.actorName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={ACTION_VARIANT[r.action] ?? "default"} className="capitalize">
                      {r.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{r.entityType}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground" title={r.diff ?? ""}>
                    {r.diff ?? "—"}
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
