import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/server/auth/require-user";
import { getOrganization } from "@/server/services/organization";
import { PageHeader } from "@/components/crm/page-header";
import { OrganizationForm } from "@/components/crm/organization-form";

export default async function OrganizationSettingsPage() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/dashboard");

  const org = await getOrganization(me.orgId);
  if (!org) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Organization"
        description="Company profile, defaults and branding used across the app."
      />
      <OrganizationForm
        org={{
          name: org.name,
          legalName: org.legalName,
          defaultCurrency: org.defaultCurrency,
          timezone: org.timezone,
          logoUrl: org.logoUrl,
          primaryColor: org.primaryColor,
          phone: org.phone,
          website: org.website,
          address: org.address,
          taxNumber: org.taxNumber,
        }}
      />
    </div>
  );
}
