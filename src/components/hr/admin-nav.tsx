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
      { href: "/admin/company-goals", label: "Company Goals", icon: Flag },
      { href: "/admin/department-roadmap", label: "Department Goals", icon: BriefcaseBusiness },
      { href: "/admin/kpi-cards", label: "KPI Cards", icon: ClipboardList },
      { href: "/admin/tasks", label: "Tasks", icon: ClipboardCheck },
      { href: "/admin/scores", label: "Monthly Scores", icon: Award },
      { href: "/admin/rewards", label: "Rewards", icon: Medal },
      { href: "/admin/accountability", label: "Accountability", icon: ShieldAlert },
      { href: "/admin/growth", label: "Growth Plans", icon: Sprout },
      { href: "/admin/training", label: "Training", icon: GraduationCap },
    ],
  },
  {
    label: "People operations",
    items: [
      { href: "/admin/attendance", label: "Attendance", icon: Clock },
      { href: "/admin/recruitment", label: "Recruitment", icon: UserPlus },
      { href: "/admin/payroll-leave", label: "Payroll & Leave", icon: BadgeDollarSign },
      { href: "/admin/compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/admin/imports", label: "Imports", icon: Import },
      { href: "/admin/reports", label: "Reports", icon: FileText },
      { href: "/admin/qr", label: "QR Code", icon: LayoutGrid },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function HrAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="dashboard-sidebar-scroll flex-1 space-y-5 overflow-y-auto px-2 py-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-white/70">{group.label}</p>
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
                    "group/nav flex items-center gap-3 rounded-[6px] px-3 py-2 text-[13px] font-medium transition-[background-color,color] duration-200",
                    isActive
                      ? "bg-[#007a4d] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]"
                      : "text-white hover:bg-white/8"
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
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
