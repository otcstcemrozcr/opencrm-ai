import { notFound } from "next/navigation";
import { requireRole } from "@/server/auth/require-user";
import { getContact } from "@/server/services/contacts";
import { listAccounts } from "@/server/services/accounts";
import { PageHeader } from "@/components/crm/page-header";
import { ContactForm } from "@/components/crm/contact-form";

export default async function EditContactPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole("rep");
  const [contact, accounts] = await Promise.all([
    getContact(user.orgId, params.id),
    listAccounts(user.orgId),
  ]);
  if (!contact) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit contact" description={contact.name} />
      <ContactForm
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
        contact={{
          id: contact.id,
          salutation: contact.salutation,
          name: contact.name,
          email: contact.email,
          secondaryEmail: contact.secondaryEmail,
          phone: contact.phone,
          mobile: contact.mobile,
          linkedin: contact.linkedin,
          title: contact.title,
          department: contact.department,
          doNotContact: contact.doNotContact,
          accountId: contact.accountId,
        }}
      />
    </div>
  );
}
