"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveFieldDef, type FormState } from "@/server/actions/custom-fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const ENTITIES = ["account", "contact", "lead", "opportunity"] as const;
const TYPES = ["text", "number", "date", "select", "checkbox"] as const;

type Props = {
  field?: {
    id: string;
    entity: (typeof ENTITIES)[number];
    key: string;
    label: string;
    type: (typeof TYPES)[number];
    options: string[];
    required: boolean;
    sortOrder: number;
    active: boolean;
  };
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create field"}
    </Button>
  );
}

export function CustomFieldForm({ field }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveFieldDef, {});
  const [type, setType] = useState<(typeof TYPES)[number]>(field?.type ?? "text");
  const isEdit = Boolean(field);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          {field && <input type="hidden" name="id" value={field.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entity">Applies to</Label>
              <Select id="entity" name="entity" defaultValue={field?.entity ?? "account"} disabled={isEdit}>
                {ENTITIES.map((e) => (
                  <option key={e} value={e} className="capitalize">{e}</option>
                ))}
              </Select>
              {isEdit && <input type="hidden" name="entity" value={field!.entity} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                id="type"
                name="type"
                value={type}
                onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="label">Label *</Label>
              <Input id="label" name="label" defaultValue={field?.label ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                name="key"
                defaultValue={field?.key ?? ""}
                placeholder="auto from label"
                pattern="[a-z0-9_]*"
              />
              <p className="text-xs text-muted-foreground">Lowercase, numbers, underscores. Leave blank to auto-generate.</p>
            </div>
          </div>

          {type === "select" && (
            <div className="space-y-2">
              <Label htmlFor="options">Options (one per line)</Label>
              <Textarea
                id="options"
                name="options"
                rows={4}
                defaultValue={field?.options.join("\n") ?? ""}
                placeholder={"Bronze\nSilver\nGold"}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={field?.sortOrder ?? 0} />
            </div>
            <label className="flex items-center gap-2 pt-7 text-sm">
              <input type="checkbox" name="required" defaultChecked={field?.required ?? false} className="h-4 w-4" />
              Required
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm">
              <input
                type="checkbox"
                name="active"
                value="on"
                defaultChecked={field?.active ?? true}
                className="h-4 w-4"
              />
              Active
            </label>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex items-center gap-2">
            <SubmitButton isEdit={isEdit} />
            <Link href="/settings/custom-fields" className={buttonVariants({ variant: "outline" })}>
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
