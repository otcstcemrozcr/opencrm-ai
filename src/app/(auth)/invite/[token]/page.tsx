import Link from "next/link";
import { getInvitationByToken } from "@/server/services/invitations";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AcceptInvitePage({ params }: { params: { token: string } }) {
  const invite = await getInvitationByToken(params.token);

  const invalid = !invite || Boolean(invite.acceptedAt) || invite.expiresAt.getTime() < Date.now();

  if (invalid) {
    const reason = !invite
      ? "This invitation link is invalid."
      : invite.acceptedAt
        ? "This invitation has already been used."
        : "This invitation has expired.";
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitation unavailable</CardTitle>
          <CardDescription>{reason}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/sign-in" className="text-sm text-accent hover:underline">
            Go to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {invite.orgName}</CardTitle>
        <CardDescription>
          You've been invited as a {invite.role}. Set your name and password to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AcceptInviteForm token={params.token} email={invite.email} />
      </CardContent>
    </Card>
  );
}
