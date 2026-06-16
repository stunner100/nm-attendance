"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Bell, ChevronDown, Menu, Search } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { LogoutButton } from "@/components/logout-button";

import { PeriodSelector } from "@/components/hr/period-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Array<{ prefix: string; title: string }> = [
  { prefix: "/admin/attendance", title: "Attendance" },
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
  { prefix: "/admin/imports", title: "Imports" },
  { prefix: "/admin/reports", title: "Reports" },
  { prefix: "/admin/settings", title: "Settings" },
  { prefix: "/admin/qr", title: "QR code" },
  { prefix: "/admin", title: "Overview" },
];

type AdminTopBarProps = {
  email: string;
};

function resolvePageTitle(pathname: string): string {
  const match = PAGE_TITLES.find((entry) =>
    entry.prefix === "/admin" ? pathname === "/admin" : pathname.startsWith(entry.prefix)
  );

  return match?.title ?? "Admin";
}

function displayNameFromEmail(email: string): string {
  if (email.trim().toLowerCase() === "admin@nm-hr.com") {
    return "HR Admin";
  }

  const local = email.split("@")[0]?.trim();
  if (!local) {
    return "HR Admin";
  }

  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminTopBar({ email }: AdminTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [results, setResults] = useState<
    Array<{ label: string; href: string; group: string }>
  >([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const isOverview = pathname === "/admin";
  const period =
    searchParams.get("period")?.trim() || new Date().toISOString().slice(0, 7);
  const pageTitle = resolvePageTitle(pathname);
  const displayName = displayNameFromEmail(email);

  useEffect(() => {
    const controller = new AbortController();
    const period =
      searchParams.get("period")?.trim() || new Date().toISOString().slice(0, 7);

    void fetch(`/api/hr/overview-notifications?period=${encodeURIComponent(period)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { count?: number } | null) => {
        if (typeof data?.count === "number") {
          setNotificationCount(data.count);
        }
      })
      .catch(() => {
        // Ignore aborted notification requests.
      });

    return () => controller.abort();
  }, [searchParams]);

  useEffect(() => {
    if (query.trim().length < 2) {
      const timeout = window.setTimeout(() => {
        setResults([]);
        setSearchOpen(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/hr/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          results?: Array<{ label: string; href: string; group: string }>;
        };
        setResults(data.results ?? []);
        setSearchOpen(true);
      } catch {
        // Ignore aborted or failed search requests.
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  const onSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const first = results[0];
    if (first) {
      router.push(first.href);
      setSearchOpen(false);
      setQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e5e7eb] bg-white">
      <div className="flex min-h-20 items-center gap-4 px-4 sm:px-6 lg:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <button aria-label="Open menu" className="hidden text-[#475569] lg:block">
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-semibold tracking-tight text-[#0f172a]">
              {pageTitle}
            </h1>
            <p className="mt-0.5 text-xs text-[#64748b]">Welcome back, {displayName}</p>
          </div>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">
          <form className="relative w-full max-w-[296px]" onSubmit={onSearchSubmit}>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchOpen(results.length > 0)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Search employees, KPIs, tasks..."
              className="h-9 rounded-[6px] border-[#d7dde7] bg-[#fbfcfe] pl-10 text-[13px] shadow-none placeholder:text-[#7b8497]"
            />
            {searchOpen && results.length > 0 ? (
              <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-lg border border-[#e5e7eb] bg-white shadow-lg">
                {results.map((result) => (
                  <Link
                    key={`${result.group}-${result.href}`}
                    href={result.href}
                    className="block border-b border-[#eef2f7] px-3 py-2 text-sm last:border-b-0 hover:bg-[#f8fafc]"
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    <p className="font-medium">{result.label}</p>
                    <p className="text-xs text-[#64748b]">{result.group}</p>
                  </Link>
                ))}
              </div>
            ) : null}
          </form>
        </div>

        <div className="flex items-center gap-4">
            <Button
              asChild
              size="icon"
              variant="ghost"
              className={cn("relative h-9 w-9 rounded-full text-[#334155] hover:bg-[#f1f5f9]", notificationCount > 0 && "text-[#0f172a]")}
            >
              <Link href="/admin#alerts" aria-label="View alerts">
                <Bell className="h-4 w-4" />
                {notificationCount > 0 ? (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b4f] px-1 text-[10px] font-semibold text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                ) : null}
              </Link>
            </Button>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(145deg,#8b4f2d,#321407)] text-xs font-semibold text-white ring-2 ring-white shadow-sm">
                {displayName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-[#0f172a]">{displayName}</p>
                <p className="truncate text-xs text-[#64748b]">Super Admin</p>
              </div>
              <ChevronDown className="h-4 w-4 text-[#334155]" />
            </div>
        </div>
      </div>
      <div className="flex min-h-10 items-center justify-end gap-3 border-t border-[#eef2f7] bg-[#f8fafc] px-4 sm:px-6 lg:px-4">
        {isOverview ? <PeriodSelector period={period} /> : null}
        <Button asChild size="sm" className="h-8 rounded-[6px] bg-[#00965f] px-4 text-xs font-semibold text-white shadow-[0_6px_14px_rgba(0,150,95,0.24)] hover:bg-[#008955]">
          <Link href="/admin/scores">
            <BarChart3 className="h-3.5 w-3.5" />
            Record Scores
          </Link>
        </Button>
        <div className="sr-only">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
