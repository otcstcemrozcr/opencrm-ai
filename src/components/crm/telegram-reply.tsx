"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { sendMessageAction, type ReplyState } from "@/server/actions/telegram-hub";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send"}
    </Button>
  );
}

export function TelegramReply({ conversationId }: { conversationId: string }) {
  const [state, formAction] = useFormState<ReplyState, FormData>(sendMessageAction, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="space-y-2">
      <input type="hidden" name="conversationId" value={conversationId} />
      <Textarea name="text" placeholder="Write a reply…" rows={3} required />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex justify-end">
        <SendButton />
      </div>
    </form>
  );
}
