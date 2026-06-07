"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveAccount, type FormState } from "@/server/actions/accounts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  account?: {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
  };
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create account"}
    </Button>
  );
}

export function AccountForm({ account }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveAccount, {});
  const isEdit = Boolean(account);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          {account && <input type="hidden" name="id" value={account.id} />}

          <div className="space-y-2">
            <Label htmlFor="name">Account name *</Label>
            <Input id="name" name="name" defaultValue={account?.name ?? ""} required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                name="industry"
                defaultValue={account?.industry ?? ""}
                placeholder="e.g. Manufacturing"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                defaultValue={account?.website ?? ""}
                placeholder="https://"
              />
            </div>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex items-center gap-2">
            <SubmitButton isEdit={isEdit} />
            <Link
              href={account ? `/accounts/${account.id}` : "/accounts"}
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
