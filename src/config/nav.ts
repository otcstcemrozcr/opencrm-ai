import {
  LayoutDashboard,
  Megaphone,
  Users,
  Building2,
  Contact,
  Target,
  FileText,
  Package,
  CalendarClock,
  CopyCheck,
  BarChart3,
  ShieldCheck,
  UserCog,
  Building,
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
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Opportunities", href: "/opportunities", icon: Target },
  { label: "Accounts", href: "/accounts", icon: Building2 },
  { label: "Contacts", href: "/contacts", icon: Contact },
  { label: "Activities", href: "/activities", icon: CalendarClock },
  { label: "Products", href: "/products", icon: Package },
  { label: "Quotes", href: "/quotes", icon: FileText },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Duplicates", href: "/duplicates", icon: CopyCheck },
  { label: "Users", href: "/settings/users", icon: UserCog, adminOnly: true },
  { label: "Organization", href: "/settings/organization", icon: Building, adminOnly: true },
  { label: "Audit log", href: "/audit", icon: ShieldCheck, adminOnly: true },
];
