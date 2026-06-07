import {
  LayoutDashboard,
  Users,
  Building2,
  Contact,
  Target,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

// MVP-0 modules. Reporting/Campaigns/Admin land in later phases.
export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Opportunities", href: "/opportunities", icon: Target },
  { label: "Accounts", href: "/accounts", icon: Building2 },
  { label: "Contacts", href: "/contacts", icon: Contact },
  { label: "Quotes", href: "/quotes", icon: FileText },
];
