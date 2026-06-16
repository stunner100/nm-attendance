"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Gauge, Search } from "lucide-react";
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
      setResults([]);
      return;
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
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back, {displayName}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {isOverview ? <PeriodSelector period={period} /> : null}
            <Button asChild size="sm">
              <Link href="/admin/scores">
                <Gauge className="h-4 w-4" />
                Record scores
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <form className="relative min-w-0 flex-1 sm:max-w-md" onSubmit={onSearchSubmit}>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setSearchOpen(results.length > 0)}
              onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Search employees, KPIs, tasks..."
              className="h-10 pl-9"
            />
            {searchOpen && results.length > 0 ? (
              <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                {results.map((result) => (
                  <Link
                    key={`${result.group}-${result.href}`}
                    href={result.href}
                    className="block border-b border-border px-3 py-2 text-sm last:border-b-0 hover:bg-muted"
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    <p className="font-medium">{result.label}</p>
                    <p className="text-xs text-muted-foreground">{result.group}</p>
                  </Link>
                ))}
              </div>
            ) : null}
          </form>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="icon"
              className={cn("relative", notificationCount > 0 && "border-rose-200")}
            >
              <Link href="/admin#alerts" aria-label="View alerts">
                <Bell className="h-4 w-4" />
                {notificationCount > 0 ? (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                ) : null}
              </Link>
            </Button>

            <div className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {displayName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">Super Admin</p>
              </div>
            </div>

            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
