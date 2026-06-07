"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveContact, type FormState } from "@/server/actions/contacts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type AccountOption = { id: string; name: string };

type Props = {
  accounts: AccountOption[];
  contact?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    title: string | null;
    accountId: string | null;
  };
  defaultAccountId?: string;
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create contact"}
    </Button>
  );
}

export function ContactForm({ accounts, contact, defaultAccountId }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveContact, {});
  const isEdit = Boolean(contact);
  const selectedAccount = contact?.accountId ?? defaultAccountId ?? "";

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          {contact && <input type="hidden" name="id" value={contact.id} />}

          <div className="space-y-2">
            <Label htmlFor="name">Full name *</Label>
            <Input id="name" name="name" defaultValue={contact?.name ?? ""} required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={contact?.title ?? ""} />
            </div>
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
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn</Label>
            <Input id="linkedin" name="linkedin" defaultValue={contact?.linkedin ?? ""} placeholder="https://linkedin.com/in/…" />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex items-center gap-2">
            <SubmitButton isEdit={isEdit} />
            <Link
              href={contact ? `/contacts/${contact.id}` : "/contacts"}
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
