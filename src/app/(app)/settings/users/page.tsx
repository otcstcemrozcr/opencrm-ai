import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { requireUser } from "@/server/auth/require-user";
import { listUsersForAdmin } from "@/server/services/users";
import { setUserActiveAction } from "@/server/actions/users";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { RoleMatrix } from "@/components/crm/role-matrix";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_VARIANT: Record<string, "default" | "accent" | "success" | "warning"> = {
  admin: "warning",
  manager: "accent",
  rep: "default",
  viewer: "default",
};

export default async function UsersPage() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/dashboard");
  const rows = await listUsersForAdmin(me.orgId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage who can access your organization and what they can do."
        action={
          <Link href="/settings/users/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" /> New user
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="No users yet" description="Invite teammates to collaborate in your CRM." />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => {
                const isSelf = u.id === me.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_VARIANT[u.role] ?? "default"} className="capitalize">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? "success" : "destructive"}>
                        {u.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {u.lastLoginAt ? u.lastLoginAt.toLocaleString("en-US") : "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/settings/users/${u.id}/edit`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Link>
                        {!isSelf && (
                          <form action={setUserActiveAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <input type="hidden" name="activate" value={(!u.isActive).toString()} />
                            <Button
                              type="submit"
                              variant={u.isActive ? "ghost" : "outline"}
                              size="sm"
                            >
                              {u.isActive ? "Deactivate" : "Reactivate"}
                            </Button>
                          </form>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <RoleMatrix />
    </div>
  );
}
