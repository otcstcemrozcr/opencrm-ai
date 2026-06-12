"use client";

import { useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Sparkles } from "lucide-react";
import {
  composeDraftAction,
  sendRecordEmailAction,
  type SendState,
} from "@/server/actions/record-email";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  relatedType: "lead" | "contact" | "account" | "opportunity";
  relatedId: string;
  recipientName: string;
  company: string | null;
  defaultTo: string;
};

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sending…" : "Send / log email"}
    </Button>
  );
}

export function EmailComposePanel({ relatedType, relatedId, recipientName, company, defaultTo }: Props) {
  const [state, formAction] = useFormState<SendState, FormData>(sendRecordEmailAction, {});
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [purpose, setPurpose] = useState("");
  const [drafting, startDraft] = useTransition();
  const [draftSource, setDraftSource] = useState<string | null>(null);

  function generate() {
    const fd = new FormData();
    fd.set("recipientName", recipientName);
    if (company) fd.set("company", company);
    fd.set("purpose", purpose);
    startDraft(async () => {
      const res = await composeDraftAction(fd);
      if (res.subject) setSubject(res.subject);
      if (res.body) setBody(res.body);
      setDraftSource(res.source ?? null);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="purpose" className="text-xs">What's this email about? (optional)</Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. follow up after the demo"
            />
          </div>
          <Button type="button" variant="outline" onClick={generate} disabled={drafting}>
            <Sparkles className="h-4 w-4" /> {drafting ? "Drafting…" : "AI draft"}
          </Button>
        </div>
        {draftSource === "template" && (
          <p className="text-xs text-muted-foreground">
            Drafted from a template. Set ANTHROPIC_API_KEY for AI-written drafts.
          </p>
        )}

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="relatedType" value={relatedType} />
          <input type="hidden" name="relatedId" value={relatedId} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input id="to" name="to" type="email" defaultValue={defaultTo} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">Message</Label>
            <Textarea id="body" name="body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.ok && (
            <p className="text-sm text-success">
              {state.delivered ? "Email sent and logged to the timeline." : "Email not delivered (no email key) — logged to the timeline."}
            </p>
          )}

          <div className="flex justify-end">
            <SendButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
