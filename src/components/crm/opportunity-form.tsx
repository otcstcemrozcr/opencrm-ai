"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveOpportunity, type FormState } from "@/server/actions/opportunities";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const STAGES = [
  "new",
  "qualified",
  "discovery",
  "meeting",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const;

type AccountOption = { id: string; name: string };

type Props = {
  accounts: AccountOption[];
  opportunity?: {
    id: string;
    name: string;
    accountId: string | null;
    stage: (typeof STAGES)[number];
    value: string;
    probability: number;
    expectedClose: string | null;
    competitor: string | null;
    notes: string | null;
  };
  defaultAccountId?: string;
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create opportunity"}
    </Button>
  );
}

export function OpportunityForm({ accounts, opportunity, defaultAccountId }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveOpportunity, {});
  const isEdit = Boolean(opportunity);
  const selectedAccount = opportunity?.accountId ?? defaultAccountId ?? "";

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          {opportunity && <input type="hidden" name="id" value={opportunity.id} />}

          <div className="space-y-2">
            <Label htmlFor="name">Opportunity name *</Label>
            <Input id="name" name="name" defaultValue={opportunity?.name ?? ""} required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accountId">Account</Label>
              <Select id="accountId" name="accountId" defaultValue={selectedAccount}>
                <option value="">— None —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select id="stage" name="stage" defaultValue={opportunity?.stage ?? "new"} className="capitalize">
                {STAGES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" type="number" min={0} step="0.01" defaultValue={opportunity?.value ?? "0"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input id="probability" name="probability" type="number" min={0} max={100} defaultValue={opportunity?.probability ?? 0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedClose">Expected close</Label>
              <Input id="expectedClose" name="expectedClose" type="date" defaultValue={opportunity?.expectedClose ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="competitor">Competitor</Label>
            <Input id="competitor" name="competitor" defaultValue={opportunity?.competitor ?? ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" defaultValue={opportunity?.notes ?? ""} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex items-center gap-2">
            <SubmitButton isEdit={isEdit} />
            <Link
              href={opportunity ? `/opportunities/${opportunity.id}` : "/opportunities"}
              className={buttonVariants({ variant: "outline" })}
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
