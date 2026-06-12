import { requireUser } from "@/server/auth/require-user";
import { PageHeader } from "@/components/crm/page-header";
import { AssistantChat } from "@/components/crm/assistant-chat";

export default async function AssistantPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Analyst"
        description="Ask questions about your pipeline, leads and quotes — answered from live, deterministic data."
      />
      <AssistantChat />
    </div>
  );
}
