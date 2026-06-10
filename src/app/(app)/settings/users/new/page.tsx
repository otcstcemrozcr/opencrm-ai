import { redirect } from "next/navigation";
import { requireUser } from "@/server/auth/require-user";
import { PageHeader } from "@/components/crm/page-header";
import { UserForm } from "@/components/crm/user-form";

export default async function NewUserPage() {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="New user" description="Add a teammate and assign their role." />
      <UserForm />
    </div>
  );
}
