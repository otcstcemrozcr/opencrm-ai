"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { inviteUser, type InviteState } from "@/server/actions/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const ROLES = ["admin", "manager", "rep", "viewer"] as const;

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send invite"}
    </Button>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

export function InvitePanel() {
  const [state, formAction] = useFormState<InviteState, FormData>(inviteUser, {});

  return (
    <div className="space-y-4">
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="invite-email">Email</Label>
          <Input id="invite-email" name="email" type="email" placeholder="teammate@company.com" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invite-role">Role</Label>
          <Select id="invite-role" name="role" defaultValue="rep">
            {ROLES.map((r) => (
              <option key={r} value={r} className="capitalize">{r}</option>
            ))}
          </Select>
        </div>
        <SendButton />
      </form>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.ok && state.link && (
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <p className="font-medium">
            {state.delivered
              ? "Invitation email sent."
              : "Invitation created — email isn't configured, so share this link:"}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Input readOnly value={state.link} className="font-mono text-xs" />
            <CopyButton value={state.link} />
          </div>
        </div>
      )}
    </div>
  );
}
