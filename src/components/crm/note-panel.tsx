"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { addNote, deleteNoteAction, type FormState } from "@/server/actions/notes";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Note = {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
};

type Props = {
  relatedType: "lead" | "opportunity" | "account" | "contact";
  relatedId: string;
  canWrite: boolean;
  items: Note[];
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adding…" : "Add note"}
    </Button>
  );
}

export function NotePanel({ relatedType, relatedId, canWrite, items }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(addNote, {});
  const formRef = useRef<HTMLFormElement>(null);
  const path = `/${relatedType}s/${relatedId}`;

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {canWrite && (
          <form ref={formRef} action={formAction} className="space-y-2">
            <input type="hidden" name="relatedType" value={relatedType} />
            <input type="hidden" name="relatedId" value={relatedId} />
            <Textarea name="body" placeholder="Write a note…" rows={2} />
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <div className="flex justify-end">
              <AddButton />
            </div>
          </form>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li key={n.id} className="group rounded-md border bg-card/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                  {canWrite && (
                    <form action={deleteNoteAction}>
                      <input type="hidden" name="id" value={n.id} />
                      <input type="hidden" name="path" value={path} />
                      <Button variant="ghost" size="icon" type="submit" aria-label="Delete note" className="opacity-0 transition-opacity group-hover:opacity-100">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </form>
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {n.authorName ?? "Unknown"} · {new Date(n.createdAt).toLocaleString("en-US")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
