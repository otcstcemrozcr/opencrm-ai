"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { createActivityStandalone, type FormState } from "@/server/actions/activities";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const TYPES = ["call", "meeting", "demo", "site_visit", "follow_up"] as const;

type Opt = { id: string; label: string };
type Props = {
  related: { accounts: Opt[]; contacts: Opt[]; leads: Opt[]; opportunities: Opt[] };
  defaultRelated?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Create activity"}
    </Button>
  );
}

export function ActivityCreateForm({ related, defaultRelated }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(createActivityStandalone, {});

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" defaultValue="follow_up">
                {TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t.replace("_", " ")}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueAt">Due date</Label>
              <Input id="dueAt" name="dueAt" type="datetime-local" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input id="subject" name="subject" required placeholder="e.g. Call to follow up" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="related">Related to *</Label>
            <Select id="related" name="related" defaultValue={defaultRelated ?? ""} required>
              <option value="">— Select a record —</option>
              {related.opportunities.length > 0 && (
                <optgroup label="Opportunities">
                  {related.opportunities.map((o) => (
                    <option key={o.id} value={`opportunity:${o.id}`}>{o.label}</option>
                  ))}
                </optgroup>
              )}
              {related.accounts.length > 0 && (
                <optgroup label="Accounts">
                  {related.accounts.map((o) => (
                    <option key={o.id} value={`account:${o.id}`}>{o.label}</option>
                  ))}
                </optgroup>
              )}
              {related.contacts.length > 0 && (
                <optgroup label="Contacts">
                  {related.contacts.map((o) => (
                    <option key={o.id} value={`contact:${o.id}`}>{o.label}</option>
                  ))}
                </optgroup>
              )}
              {related.leads.length > 0 && (
                <optgroup label="Leads">
                  {related.leads.map((o) => (
                    <option key={o.id} value={`lead:${o.id}`}>{o.label}</option>
                  ))}
                </optgroup>
              )}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex items-center gap-2">
            <SubmitButton />
            <Link href="/activities" className={buttonVariants({ variant: "outline" })}>
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
