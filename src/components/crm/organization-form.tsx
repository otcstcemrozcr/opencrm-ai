"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveOrganization, type FormState } from "@/server/actions/organization";
import { CURRENCIES, TIMEZONES } from "@/config/org-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  org: {
    name: string;
    legalName: string | null;
    defaultCurrency: string;
    timezone: string;
    logoUrl: string | null;
    primaryColor: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    taxNumber: string | null;
  };
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Save settings"}
    </Button>
  );
}

export function OrganizationForm({ org }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveOrganization, {});

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-6">
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Organization name *</Label>
                <Input id="name" name="name" defaultValue={org.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal name</Label>
                <Input id="legalName" name="legalName" defaultValue={org.legalName ?? ""} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultCurrency">Default currency</Label>
                <Select id="defaultCurrency" name="defaultCurrency" defaultValue={org.defaultCurrency}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select id="timezone" name="timezone" defaultValue={org.timezone}>
                  {TIMEZONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-medium">Branding</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  name="logoUrl"
                  type="url"
                  inputMode="url"
                  placeholder="https://…/logo.png"
                  defaultValue={org.logoUrl ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary color (hex)</Label>
                <Input
                  id="primaryColor"
                  name="primaryColor"
                  placeholder="#2563EB"
                  defaultValue={org.primaryColor ?? ""}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-medium">Company details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" defaultValue={org.phone ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  inputMode="url"
                  placeholder="https://example.com"
                  defaultValue={org.website ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxNumber">Tax number</Label>
                <Input id="taxNumber" name="taxNumber" defaultValue={org.taxNumber ?? ""} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" defaultValue={org.address ?? ""} />
            </div>
          </section>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state.ok && <p className="text-sm text-success">Settings saved.</p>}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
