"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  Briefcase,
  CheckSquare,
  Clock,
  DollarSign,
  FileText,
  Flag,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Map,
  QrCode,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sprout,
  Target,
  Upload,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Main",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/headcount", label: "Employees", icon: Briefcase },
    ],
  },
  {
    label: "Performance",
    items: [
      { href: "/admin/company-goals", label: "Company goals", icon: Flag },
      { href: "/admin/department-roadmap", label: "Department goals", icon: Map },
      { href: "/admin/kpi-cards", label: "KPI cards", icon: Target },
      { href: "/admin/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/admin/scores", label: "Monthly scores", icon: Gauge },
      { href: "/admin/rewards", label: "Rewards", icon: Award },
      { href: "/admin/accountability", label: "Accountability", icon: ShieldAlert },
      { href: "/admin/growth", label: "Growth plans", icon: Sprout },
      { href: "/admin/training", label: "Training", icon: GraduationCap },
    ],
  },
  {
    label: "People operations",
    items: [
      { href: "/admin/attendance", label: "Attendance", icon: Clock },
      { href: "/admin/recruitment", label: "Recruitment", icon: Users },
      { href: "/admin/payroll-leave", label: "Payroll & leave", icon: DollarSign },
      { href: "/admin/compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/admin/imports", label: "Imports", icon: Upload },
      { href: "/admin/reports", label: "Reports", icon: FileText },
      { href: "/admin/qr", label: "QR code", icon: QrCode },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function HrAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">{group.label}</p>
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
                    "group/nav flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,color] duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
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
