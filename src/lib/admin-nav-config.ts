import type { LucideIcon } from "lucide-react";
import {
  Award,
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock,
  FileText,
  Flag,
  GraduationCap,
  Home,
  Import,
  LayoutGrid,
  Medal,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Star,
  UserPlus,
  Users,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  label: string;
  collapsible: boolean;
  defaultOpen?: boolean;
  items: AdminNavItem[];
};

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Main",
    collapsible: false,
    items: [
      { href: "/admin", label: "Overview", icon: Home },
      { href: "/admin/headcount", label: "Employees", icon: Users },
    ],
  },
  {
    label: "Performance",
    collapsible: true,
    defaultOpen: true,
    items: [
      { href: "/admin/company-goals", label: "Company goals", icon: Flag },
      { href: "/admin/department-roadmap", label: "Department goals", icon: BriefcaseBusiness },
      { href: "/admin/kpi-cards", label: "KPI cards", icon: ClipboardList },
      { href: "/admin/tasks", label: "Tasks", icon: ClipboardCheck },
      { href: "/admin/scores", label: "Monthly scores", icon: Award },
      { href: "/admin/rewards", label: "Rewards", icon: Medal },
      { href: "/admin/accountability", label: "Accountability", icon: ShieldAlert },
      { href: "/admin/performance", label: "Performance reviews", icon: Star },
      { href: "/admin/growth", label: "Growth plans", icon: Sprout },
      { href: "/admin/training", label: "Training", icon: GraduationCap },
    ],
  },
  {
    label: "People operations",
    collapsible: true,
    defaultOpen: false,
    items: [
      { href: "/admin/attendance", label: "Attendance", icon: Clock },
      { href: "/admin/roster", label: "Roster", icon: CalendarDays },
      { href: "/admin/recruitment", label: "Recruitment", icon: UserPlus },
      { href: "/admin/payroll-leave", label: "Payroll & leave", icon: BadgeDollarSign },
      { href: "/admin/compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Tools",
    collapsible: true,
    defaultOpen: false,
    items: [
      { href: "/admin/imports", label: "Imports", icon: Import },
      { href: "/admin/reports", label: "Reports", icon: FileText },
      { href: "/admin/qr", label: "QR code", icon: LayoutGrid },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const ADMIN_PAGE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: "/admin/attendance", title: "Attendance" },
  { prefix: "/admin/roster", title: "Roster" },
  { prefix: "/admin/headcount", title: "Employees" },
  { prefix: "/admin/company-goals", title: "Company goals" },
  { prefix: "/admin/department-roadmap", title: "Department goals" },
  { prefix: "/admin/kpi-cards", title: "KPI cards" },
  { prefix: "/admin/tasks", title: "Tasks" },
  { prefix: "/admin/scores", title: "Monthly scores" },
  { prefix: "/admin/rewards", title: "Rewards" },
  { prefix: "/admin/accountability", title: "Accountability" },
  { prefix: "/admin/growth", title: "Growth plans" },
  { prefix: "/admin/training", title: "Training" },
  { prefix: "/admin/recruitment", title: "Recruitment" },
  { prefix: "/admin/payroll-leave", title: "Payroll & leave" },
  { prefix: "/admin/compliance", title: "Compliance" },
  { prefix: "/admin/performance", title: "Performance" },
  { prefix: "/admin/imports", title: "Imports" },
  { prefix: "/admin/reports", title: "Reports" },
  { prefix: "/admin/settings", title: "Settings" },
  { prefix: "/admin/qr", title: "QR code" },
  { prefix: "/admin", title: "Overview" },
];

export function resolveAdminPageTitle(pathname: string): string {
  const match = ADMIN_PAGE_TITLES.find((entry) =>
    entry.prefix === "/admin" ? pathname === "/admin" : pathname.startsWith(entry.prefix)
  );

  return match?.title ?? "Admin";
}

export function isAdminNavItemActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}
