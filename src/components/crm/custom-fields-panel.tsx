"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  saveRecordCustomFields,
  type FormState,
} from "@/server/actions/custom-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Field = {
  id: string;
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "checkbox";
  options: string[];
  required: boolean;
  value: string | null;
};

type Props = {
  entity: "account" | "contact" | "lead" | "opportunity";
  recordId: string;
  canWrite: boolean;
  fields: Field[];
};

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Saving…" : "Save"}
    </Button>
  );
}

function FieldInput({ f }: { f: Field }) {
  const name = `cf_${f.id}`;
  if (f.type === "select") {
    return (
      <Select id={name} name={name} defaultValue={f.value ?? ""} required={f.required}>
        <option value="">—</option>
        {f.options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </Select>
    );
  }
  if (f.type === "checkbox") {
    return (
      <label className="flex h-10 items-center gap-2 text-sm">
        {/* Empty fallback so unchecking clears the value (action keeps the last cf_<id> entry). */}
        <input type="hidden" name={name} value="" />
        <input type="checkbox" name={name} value="true" defaultChecked={f.value === "true"} className="h-4 w-4" />
        Yes
      </label>
    );
  }
  const inputType = f.type === "number" ? "number" : f.type === "date" ? "date" : "text";
  return (
    <Input id={name} name={name} type={inputType} defaultValue={f.value ?? ""} required={f.required} />
  );
}

export function CustomFieldsPanel({ entity, recordId, canWrite, fields }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveRecordCustomFields, {});

  if (fields.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Custom fields</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="entity" value={entity} />
          <input type="hidden" name="recordId" value={recordId} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.id} className="space-y-2">
                <Label htmlFor={`cf_${f.id}`}>
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </Label>
                {canWrite ? (
                  <FieldInput f={f} />
                ) : (
                  <p className="text-sm">{f.value || <span className="text-muted-foreground">—</span>}</p>
                )}
              </div>
            ))}
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.ok && <p className="text-sm text-success">Saved.</p>}

          {canWrite && (
            <div className="flex justify-end">
              <SaveButton />
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
