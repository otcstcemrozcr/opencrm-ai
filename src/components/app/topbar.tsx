"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  userName: string;
  orgName: string;
  role: string;
};

export function Topbar({ userName, orgName, role }: Props) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="text-sm font-medium text-muted-foreground">{orgName}</div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-sm font-medium leading-tight">{userName}</div>
          <div className="text-xs capitalize text-muted-foreground">{role}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
