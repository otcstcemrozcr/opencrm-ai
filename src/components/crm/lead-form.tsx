"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveLead, type FormState } from "@/server/actions/leads";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

const STATUSES = ["new", "working", "qualified", "unqualified", "converted"] as const;

type Props = {
  campaigns?: { id: string; name: string }[];
  lead?: {
    id: string;
    company: string;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    linkedin: string | null;
    source: string | null;
    industry: string | null;
    status: (typeof STATUSES)[number];
    score: number;
    rating: "hot" | "warm" | "cold" | null;
    estimatedValue: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    doNotContact: boolean;
    campaignId: string | null;
  };
};

const RATINGS = ["hot", "warm", "cold"] as const;

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create lead"}
    </Button>
  );
}

export function LeadForm({ lead, campaigns = [] }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveLead, {});
  const isEdit = Boolean(lead);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          {lead && <input type="hidden" name="id" value={lead.id} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input id="company" name="company" defaultValue={lead?.company ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact name</Label>
              <Input id="contactName" name="contactName" defaultValue={lead?.contactName ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={lead?.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={lead?.phone ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" defaultValue={lead?.source ?? ""} placeholder="e.g. Apollo, Event, Referral" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" name="industry" defaultValue={lead?.industry ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" name="linkedin" defaultValue={lead?.linkedin ?? ""} placeholder="https://linkedin.com/in/…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaignId">Campaign</Label>
              <Select id="campaignId" name="campaignId" defaultValue={lead?.campaignId ?? ""}>
                <option value="">— None —</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={lead?.status ?? "new"}>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">Lead score</Label>
              <Input id="score" type="number" value={lead?.score ?? 0} readOnly disabled />
              <p className="text-xs text-muted-foreground">
                Calculated automatically from rules when you save.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Select id="rating" name="rating" defaultValue={lead?.rating ?? ""}>
                <option value="">—</option>
                {RATINGS.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated value</Label>
              <Input id="estimatedValue" name="estimatedValue" type="number" min={0} step="0.01" defaultValue={lead?.estimatedValue ?? ""} />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="mb-2 text-sm font-medium text-muted-foreground">Attribution (UTM)</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="utmSource">Source</Label>
                <Input id="utmSource" name="utmSource" defaultValue={lead?.utmSource ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utmMedium">Medium</Label>
                <Input id="utmMedium" name="utmMedium" defaultValue={lead?.utmMedium ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="utmCampaign">Campaign</Label>
                <Input id="utmCampaign" name="utmCampaign" defaultValue={lead?.utmCampaign ?? ""} />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="doNotContact" defaultChecked={lead?.doNotContact ?? false} />
            Do not contact (GDPR/KVKK)
          </label>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex items-center gap-2">
            <SubmitButton isEdit={isEdit} />
            <Link
              href={lead ? `/leads/${lead.id}` : "/leads"}
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
