"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveUser, type FormState } from "@/server/actions/users";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const ROLES = ["admin", "manager", "rep", "viewer"] as const;

type Props = {
  user?: {
    id: string;
    name: string;
    email: string;
    role: (typeof ROLES)[number];
  };
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create user"}
    </Button>
  );
}

export function UserForm({ user }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveUser, {});
  const isEdit = Boolean(user);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          {user && <input type="hidden" name="id" value={user.id} />}

          <div className="space-y-2">
            <Label htmlFor="name">Full name *</Label>
            <Input id="name" name="name" defaultValue={user?.name ?? ""} required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" defaultValue={user?.email ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select id="role" name="role" defaultValue={user?.role ?? "rep"}>
                {ROLES.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{isEdit ? "New password" : "Initial password *"}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required={!isEdit}
              placeholder={isEdit ? "Leave blank to keep current password" : "At least 8 characters"}
            />
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? "Only fill this in to reset the user's password."
                : "The user can change this after their first sign-in."}
            </p>
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex items-center gap-2">
            <SubmitButton isEdit={isEdit} />
            <Link href="/settings/users" className={buttonVariants({ variant: "outline" })}>
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
