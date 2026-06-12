import Link from "next/link";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { listConversations, displayName } from "@/server/services/telegram-hub";
import { isTelegramConfigured } from "@/server/notify/telegram";
import { PageHeader } from "@/components/crm/page-header";
import { EmptyState } from "@/components/crm/empty-state";
import { ConnectLinkButton } from "@/components/crm/connect-link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function MessagesPage() {
  const user = await requireUser();
  const conversations = await listConversations(user.orgId);
  const writable = canWrite(user.role);
  const configured = isTelegramConfigured();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Two-way Telegram conversations with your leads and contacts."
      />

      {!configured && (
        <div className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          Telegram isn&apos;t configured yet. Set <code>TELEGRAM_BOT_TOKEN</code> and register the
          webhook at <code>/api/telegram/webhook</code> (with <code>TELEGRAM_WEBHOOK_SECRET</code>).
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {conversations.length === 0 ? (
            <EmptyState
              title="No conversations yet"
              description="Share a connect link so a customer can start chatting with your bot."
            />
          ) : (
            <Card>
              <ul className="divide-y">
                {conversations.map((c) => (
                  <li key={c.id}>
                    <Link href={`/messages/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50">
                      <div className="min-w-0">
                        <div className="font-medium">{displayName(c)}</div>
                        <div className="truncate text-sm text-muted-foreground">
                          {c.lastMessagePreview ?? "No messages yet"}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {c.lastMessageAt ? c.lastMessageAt.toLocaleString("en-US") : ""}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        {writable && (
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">Connect a customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Generate a link. When the customer opens it and presses Start, their chat appears here.
              </p>
              <ConnectLinkButton />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
