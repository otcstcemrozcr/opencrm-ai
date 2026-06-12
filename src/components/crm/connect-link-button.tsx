"use client";

import { useState, useTransition } from "react";
import { createConnectLinkAction, type ConnectLinkState } from "@/server/actions/telegram-hub";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Generates a t.me deep link a customer taps to start a conversation under this org. */
export function ConnectLinkButton() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ConnectLinkState | null>(null);

  function generate() {
    start(async () => {
      const res = await createConnectLinkAction(new FormData());
      setResult(res);
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={generate} disabled={pending}>
        {pending ? "Generating…" : "Create connect link"}
      </Button>
      {result?.error && <p className="text-sm text-destructive">{result.error}</p>}
      {result?.link && (
        <Input readOnly value={result.link} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
      )}
      {result && !result.link && result.token && (
        <p className="text-xs text-muted-foreground">
          Connect token: <code>{result.token}</code>. Set <code>TELEGRAM_BOT_USERNAME</code> to get a
          ready t.me link. Share <code>/start {result.token}</code> with the bot.
        </p>
      )}
    </div>
  );
}
