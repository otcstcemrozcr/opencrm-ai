import Link from "next/link";
import { getResetByToken } from "@/server/services/password-reset";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ResetPasswordPage({ params }: { params: { token: string } }) {
  const reset = await getResetByToken(params.token);
  const invalid = !reset || Boolean(reset.usedAt) || reset.expiresAt.getTime() < Date.now();

  if (invalid) {
    const reason = !reset
      ? "This reset link is invalid."
      : reset.usedAt
        ? "This reset link has already been used."
        : "This reset link has expired.";
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link unavailable</CardTitle>
          <CardDescription>{reason}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm text-accent hover:underline">
            Request a new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={params.token} />
      </CardContent>
    </Card>
  );
}
