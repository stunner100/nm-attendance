"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BadgeDollarSign,
  BriefcaseBusiness,
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
  UserPlus,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { href: "/admin", label: "Overview", icon: Home },
      { href: "/admin/headcount", label: "Employees", icon: Users },
    ],
  },
  {
    label: "Performance",
    items: [
      { href: "/admin/company-goals", label: "Company goals", icon: Flag },
      { href: "/admin/department-roadmap", label: "Department goals", icon: BriefcaseBusiness },
      { href: "/admin/kpi-cards", label: "KPI cards", icon: ClipboardList },
      { href: "/admin/tasks", label: "Tasks", icon: ClipboardCheck },
      { href: "/admin/scores", label: "Monthly scores", icon: Award },
      { href: "/admin/rewards", label: "Rewards", icon: Medal },
      { href: "/admin/accountability", label: "Accountability", icon: ShieldAlert },
      { href: "/admin/growth", label: "Growth plans", icon: Sprout },
      { href: "/admin/training", label: "Training", icon: GraduationCap },
    ],
  },
  {
    label: "People operations",
    items: [
      { href: "/admin/attendance", label: "Attendance", icon: Clock },
      { href: "/admin/recruitment", label: "Recruitment", icon: UserPlus },
      { href: "/admin/payroll-leave", label: "Payroll & leave", icon: BadgeDollarSign },
      { href: "/admin/compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/admin/imports", label: "Imports", icon: Import },
      { href: "/admin/reports", label: "Reports", icon: FileText },
      { href: "/admin/qr", label: "QR code", icon: LayoutGrid },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function HrAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-sidebar-scroll flex-1 space-y-6 overflow-y-auto px-3 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-2 text-xs font-medium text-[var(--color-ink-muted)]">{group.label}</p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  scroll={false}
                  className={cn(
                    "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition-[background-color,color] duration-[var(--dur-short)]",
                    isActive
                      ? "bg-[var(--color-paper-2)] font-medium text-[var(--color-ink)]"
                      : "font-normal text-[var(--color-ink-2)] hover:bg-[var(--color-paper-2)] hover:text-[var(--color-ink)]"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" strokeWidth={1.75} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
