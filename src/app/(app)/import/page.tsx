import Link from "next/link";
import { requireRole } from "@/server/auth/require-user";
import { PageHeader } from "@/components/crm/page-header";
import { ImportWizard } from "@/components/crm/import-wizard";
import { IMPORT_LABELS, type ImportEntity } from "@/config/import-fields";
import { cn } from "@/lib/utils";

const ENTITIES: ImportEntity[] = ["account", "contact", "lead"];

export default async function ImportPage({
  searchParams,
}: {
  searchParams: { entity?: string };
}) {
  await requireRole("rep");
  const entity = (ENTITIES.includes(searchParams.entity as ImportEntity)
    ? searchParams.entity
    : "account") as ImportEntity;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Import" description="Bring in records from a CSV file." />

      <div className="flex rounded-md border bg-card p-0.5 w-fit">
        {ENTITIES.map((e) => (
          <Link
            key={e}
            href={`/import?entity=${e}`}
            className={cn(
              "rounded px-3 py-1.5 text-sm",
              entity === e ? "bg-muted font-medium" : "text-muted-foreground"
            )}
          >
            {IMPORT_LABELS[e]}
          </Link>
        ))}
      </div>

      <ImportWizard key={entity} entity={entity} />
    </div>
  );
}
