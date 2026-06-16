"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Clock, Users, Briefcase, ShieldCheck, DollarSign, TrendingUp, GraduationCap, Upload, QrCode, Target, Gauge, Presentation, Award, ShieldAlert, Sprout } from "lucide-react";

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
    label: "Performance Framework",
    items: [
      { href: "/admin/kpi-cards", label: "KPI Cards", icon: Target },
      { href: "/admin/scores", label: "Monthly Scores", icon: Gauge },
      { href: "/admin/presentations", label: "Presentations", icon: Presentation },
      { href: "/admin/rewards", label: "Rewards", icon: Award },
      { href: "/admin/accountability", label: "Accountability", icon: ShieldAlert },
      { href: "/admin/growth", label: "Growth Plans", icon: Sprout },
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
    <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {group.label}
          </p>
          <div className="space-y-1">
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
                    "group/nav flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold tracking-tight transition-all duration-200",
                    isActive
                      ? "bg-white text-neutral-950 shadow-[inset_0_1px_3px_rgba(15,23,42,0.035),0_10px_24px_rgba(15,23,42,0.06)] ring-1 ring-neutral-200/70"
                      : "text-neutral-500 hover:bg-white/70 hover:text-neutral-950"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl transition-colors",
                      isActive
                        ? "bg-neutral-950 text-white"
                        : "bg-white/70 text-neutral-400 group-hover/nav:text-neutral-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
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
