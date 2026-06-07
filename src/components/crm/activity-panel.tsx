"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addActivity, type FormState } from "@/server/actions/activities";
import type { ActivityRelatedType, ActivityType } from "@/server/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TYPES: { value: ActivityType; label: string }[] = [
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "demo", label: "Demo" },
  { value: "site_visit", label: "Site visit" },
  { value: "follow_up", label: "Follow-up" },
];

export type ActivityItem = {
  id: string;
  type: ActivityType;
  subject: string;
  notes: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding…" : "Add activity"}
    </Button>
  );
}

export function ActivityPanel({
  relatedType,
  relatedId,
  items,
  canWrite,
}: {
  relatedType: ActivityRelatedType;
  relatedId: string;
  items: ActivityItem[];
  canWrite: boolean;
}) {
  const [state, formAction] = useFormState<FormState, FormData>(addActivity, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Activities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canWrite && (
          <form ref={formRef} action={formAction} className="space-y-2">
            <input type="hidden" name="relatedType" value={relatedType} />
            <input type="hidden" name="relatedId" value={relatedId} />
            <div className="flex gap-2">
              <Select name="type" defaultValue="call" className="w-36">
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
              <Input name="subject" placeholder="Logged a call with…" required />
              <Input name="dueAt" type="date" className="w-40" />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <AddButton />
          </form>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activities yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((a) => (
              <li key={a.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                <Badge variant="accent" className="mt-0.5 capitalize">
                  {a.type.replace("_", " ")}
                </Badge>
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.subject}</div>
                  {a.notes && <div className="text-sm text-muted-foreground">{a.notes}</div>}
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleString()}
                    {a.dueAt && ` · due ${new Date(a.dueAt).toLocaleDateString()}`}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
