import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/server/auth/require-user";
import { getUser } from "@/server/services/users";
import { PageHeader } from "@/components/crm/page-header";
import { UserForm } from "@/components/crm/user-form";

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/dashboard");

  const user = await getUser(me.orgId, params.id);
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Edit user" description={user.email} />
      <UserForm
        user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
      />
    </div>
  );
}
