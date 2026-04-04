"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, Users, Briefcase, ShieldCheck, DollarSign, TrendingUp, GraduationCap, Upload, QrCode } from "lucide-react";

import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Daily",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/attendance", label: "Attendance", icon: Clock },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/roster", label: "Roster", icon: Users },
      { href: "/admin/headcount", label: "Employees", icon: Briefcase },
      { href: "/admin/recruitment", label: "Recruitment", icon: Users },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/payroll-leave", label: "Payroll & Leave", icon: DollarSign },
      { href: "/admin/performance", label: "Performance", icon: TrendingUp },
      { href: "/admin/training", label: "Training", icon: GraduationCap },
      { href: "/admin/compliance", label: "Compliance", icon: ShieldCheck },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/admin/imports", label: "Imports", icon: Upload },
      { href: "/admin/qr", label: "QR Code", icon: QrCode },
    ],
  },
];

export function HrAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {group.label}
          </p>
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
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-emerald-600" : "text-slate-400")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
