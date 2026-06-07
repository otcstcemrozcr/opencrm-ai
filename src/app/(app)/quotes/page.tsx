import { requireUser } from "@/server/auth/require-user";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";

export default async function QuotesPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader title="Quotes" description="Line items, discounts, tax and PDF export." />
      <EmptyState
        title="Quotes arrive in Sprint 3"
        description="This module (with PDF export) is planned for Sprint 3. See docs/08_sprint_plan.md."
      />
    </div>
  );
}
