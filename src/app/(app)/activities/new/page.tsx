import { requireRole } from "@/server/auth/require-user";
import { listAccounts } from "@/server/services/accounts";
import { listContacts } from "@/server/services/contacts";
import { listLeads } from "@/server/services/leads";
import { listOpportunities } from "@/server/services/opportunities";
import { PageHeader } from "@/components/crm/page-header";
import { ActivityCreateForm } from "@/components/crm/activity-create-form";

export default async function NewActivityPage({
  searchParams,
}: {
  searchParams: { related?: string };
}) {
  const user = await requireRole("rep");
  const [accounts, contacts, leads, opps] = await Promise.all([
    listAccounts(user.orgId),
    listContacts(user.orgId),
    listLeads(user.orgId),
    listOpportunities(user.orgId),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New activity" description="Log a call, meeting or follow-up." />
      <ActivityCreateForm
        defaultRelated={searchParams.related}
        related={{
          accounts: accounts.map((a) => ({ id: a.id, label: a.name })),
          contacts: contacts.map((c) => ({ id: c.id, label: c.name })),
          leads: leads.map((l) => ({ id: l.id, label: l.company })),
          opportunities: opps.map((o) => ({ id: o.id, label: o.name })),
        }}
      />
    </div>
  );
}
