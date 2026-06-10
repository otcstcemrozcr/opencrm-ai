import {
  LayoutDashboard,
  Users,
  Building2,
  Contact,
  Target,
  FileText,
  Package,
  CalendarClock,
  CopyCheck,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

// MVP-0 modules + Phase 2 additions. Reporting/Campaigns land later.
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Opportunities", href: "/opportunities", icon: Target },
  { label: "Accounts", href: "/accounts", icon: Building2 },
  { label: "Contacts", href: "/contacts", icon: Contact },
  { label: "Activities", href: "/activities", icon: CalendarClock },
  { label: "Products", href: "/products", icon: Package },
  { label: "Quotes", href: "/quotes", icon: FileText },
  { label: "Duplicates", href: "/duplicates", icon: CopyCheck },
  { label: "Audit log", href: "/audit", icon: ShieldCheck, adminOnly: true },
];
