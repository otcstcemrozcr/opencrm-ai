"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/config/nav";
import { cn } from "@/lib/utils";

export function Sidebar({ role }: { role?: string }) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !item.adminOnly || role === "admin");

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-card md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-lg font-semibold text-primary">OpenCRM AI</span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
