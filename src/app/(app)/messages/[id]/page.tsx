import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { getConversation, listMessages, displayName } from "@/server/services/telegram-hub";
import { PageHeader } from "@/components/crm/page-header";
import { TelegramReply } from "@/components/crm/telegram-reply";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const conv = await getConversation(user.orgId, params.id);
  if (!conv) notFound();

  const messages = await listMessages(user.orgId, conv.id);
  const writable = canWrite(user.role);

  const linkHref = conv.linkedContactId
    ? `/contacts/${conv.linkedContactId}`
    : conv.linkedLeadId
      ? `/leads/${conv.linkedLeadId}`
      : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={displayName(conv)}
        description={conv.username ? `@${conv.username}` : `Chat ${conv.chatId}`}
        action={
          <Link href="/messages" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="h-4 w-4" /> All messages
          </Link>
        }
      />

      {linkHref && (
        <p className="text-sm text-muted-foreground">
          Linked to{" "}
          <Link href={linkHref} className="text-accent hover:underline">
            {conv.linkedContactId ? "contact" : "lead"}
          </Link>
          .
        </p>
      )}

      <Card>
        <CardContent className="space-y-3 py-4">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={cn("flex", m.direction === "out" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                    m.direction === "out" ? "bg-accent text-accent-foreground" : "bg-muted"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className={cn("mt-1 text-[10px]", m.direction === "out" ? "text-accent-foreground/70" : "text-muted-foreground")}>
                    {m.createdAt.toLocaleString("en-US")}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {writable && <TelegramReply conversationId={conv.id} />}
    </div>
  );
}
