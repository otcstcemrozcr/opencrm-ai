"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveAccount, type FormState } from "@/server/actions/accounts";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const TYPES = ["prospect", "customer", "partner", "other"] as const;
const STATUSES = ["active", "inactive"] as const;
const RATINGS = ["hot", "warm", "cold"] as const;

type Props = {
  parentOptions?: { id: string; name: string }[];
  account?: {
    id: string;
    name: string;
    name2: string | null;
    type: (typeof TYPES)[number];
    industry: string | null;
    website: string | null;
    phone: string | null;
    employees: number | null;
    annualRevenue: string | null;
    taxNumber: string | null;
    taxOffice: string | null;
    currency: string;
    paymentTerms: string | null;
    creditLimit: string | null;
    status: (typeof STATUSES)[number];
    rating: (typeof RATINGS)[number] | null;
    parentAccountId: string | null;
    addressLine: string | null;
    street2: string | null;
    postalCode: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    description: string | null;
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

export function AccountForm({ account, parentOptions = [] }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveAccount, {});
  const isEdit = Boolean(account);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <form action={formAction} className="space-y-4">
          {account && <input type="hidden" name="id" value={account.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name 1 *</Label>
              <Input id="name" name="name" defaultValue={account?.name ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name2">Name 2</Label>
              <Input id="name2" name="name2" defaultValue={account?.name2 ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" defaultValue={account?.type ?? "prospect"}>
                {TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" name="industry" defaultValue={account?.industry ?? ""} placeholder="e.g. Manufacturing" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" name="website" defaultValue={account?.website ?? ""} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={account?.phone ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employees">Employees</Label>
              <Input id="employees" name="employees" type="number" min={0} defaultValue={account?.employees ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="annualRevenue">Annual revenue</Label>
              <Input id="annualRevenue" name="annualRevenue" type="number" min={0} step="0.01" defaultValue={account?.annualRevenue ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxNumber">Tax number</Label>
              <Input id="taxNumber" name="taxNumber" defaultValue={account?.taxNumber ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxOffice">Tax office</Label>
              <Input id="taxOffice" name="taxOffice" defaultValue={account?.taxOffice ?? ""} />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Address</div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="addressLine">Street 1</Label>
                  <Input id="addressLine" name="addressLine" defaultValue={account?.addressLine ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street2">Street 2</Label>
                  <Input id="street2" name="street2" defaultValue={account?.street2 ?? ""} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal code</Label>
                  <Input id="postalCode" name="postalCode" defaultValue={account?.postalCode ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" defaultValue={account?.city ?? ""} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="region">Region / State code</Label>
                  <Input id="region" name="region" defaultValue={account?.region ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" defaultValue={account?.country ?? ""} />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Commercial</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue={account?.status ?? "active"}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Select id="rating" name="rating" defaultValue={account?.rating ?? ""}>
                  <option value="">—</option>
                  {RATINGS.map((r) => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" defaultValue={account?.currency ?? "USD"} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment terms</Label>
                <Input id="paymentTerms" name="paymentTerms" defaultValue={account?.paymentTerms ?? ""} placeholder="e.g. Net 30" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit limit</Label>
                <Input id="creditLimit" name="creditLimit" type="number" min={0} step="0.01" defaultValue={account?.creditLimit ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentAccountId">Parent account</Label>
                <Select id="parentAccountId" name="parentAccountId" defaultValue={account?.parentAccountId ?? ""}>
                  <option value="">— None —</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={account?.description ?? ""} placeholder="Notes about this account" />
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
