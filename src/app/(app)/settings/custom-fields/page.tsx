import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { requireUser } from "@/server/auth/require-user";
import { listFieldDefs, ENTITIES } from "@/server/services/custom-fields";
import { removeFieldDef } from "@/server/actions/custom-fields";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ENTITY_LABEL: Record<string, string> = {
  account: "Accounts",
  contact: "Contacts",
  lead: "Leads",
  opportunity: "Opportunities",
};

export default async function CustomFieldsPage() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/dashboard");
  const defs = await listFieldDefs(me.orgId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom fields"
        description="Define extra fields per record type. They appear on each record's detail page."
        action={
          <Link href="/settings/custom-fields/new" className={buttonVariants()}>
            <Plus className="h-4 w-4" /> New field
          </Link>
        }
      />

      {defs.length === 0 ? (
        <EmptyState
          title="No custom fields yet"
          description="Add fields like industry segment, contract type or anything specific to your business."
          action={
            <Link href="/settings/custom-fields/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" /> New field
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {ENTITIES.map((entity) => {
            const rows = defs.filter((d) => d.entity === entity);
            if (rows.length === 0) return null;
            return (
              <Card key={entity}>
                <CardHeader>
                  <CardTitle className="text-base">{ENTITY_LABEL[entity]}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y">
                    {rows.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{d.label}</span>
                            <Badge variant="default" className="capitalize">{d.type}</Badge>
                            {d.required && <Badge variant="warning">Required</Badge>}
                            {!d.active && <Badge variant="destructive">Inactive</Badge>}
                          </div>
                          <code className="text-xs text-muted-foreground">{d.key}</code>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Link
                            href={`/settings/custom-fields/${d.id}/edit`}
                            className={buttonVariants({ variant: "outline", size: "sm" })}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </Link>
                          <form action={removeFieldDef}>
                            <input type="hidden" name="id" value={d.id} />
                            <Button variant="ghost" size="sm" type="submit">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
