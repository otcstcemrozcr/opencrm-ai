"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { saveCampaign, type FormState } from "@/server/actions/campaigns";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const TYPES = ["email", "event", "webinar", "linkedin", "other"] as const;
const STATUSES = ["planned", "active", "completed"] as const;

type Props = {
  campaign?: {
    id: string;
    name: string;
    type: (typeof TYPES)[number];
    status: (typeof STATUSES)[number];
    startDate: string | null;
    endDate: string | null;
    budget: string | null;
    description: string | null;
  };
};

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create campaign"}
    </Button>
  );
}

export function CampaignForm({ campaign }: Props) {
  const [state, formAction] = useFormState<FormState, FormData>(saveCampaign, {});
  const isEdit = Boolean(campaign);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-4">
          {campaign && <input type="hidden" name="id" value={campaign.id} />}

          <div className="space-y-2">
            <Label htmlFor="name">Campaign name *</Label>
            <Input id="name" name="name" defaultValue={campaign?.name ?? ""} required />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" defaultValue={campaign?.type ?? "email"}>
                {TYPES.map((t) => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={campaign?.status ?? "planned"}>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget</Label>
              <Input id="budget" name="budget" type="number" min={0} step="0.01" defaultValue={campaign?.budget ?? ""} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" name="startDate" type="date" defaultValue={campaign?.startDate ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" name="endDate" type="date" defaultValue={campaign?.endDate ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={campaign?.description ?? ""} />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <div className="flex items-center gap-2">
            <SubmitButton isEdit={isEdit} />
            <Link href={campaign ? `/campaigns/${campaign.id}` : "/campaigns"} className={buttonVariants({ variant: "outline" })}>
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
