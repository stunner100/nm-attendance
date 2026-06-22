"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Bell, Search } from "lucide-react";
import { FormEvent, useEffect, useState, useSyncExternalStore } from "react";

import { ThemePickerMenu } from "@/components/hr/theme-picker";
import { PeriodSelector } from "@/components/hr/period-selector";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { resolveAdminPageTitle } from "@/lib/admin-nav-config";
import { cn } from "@/lib/utils";

type SearchResult = { label: string; href: string; group: string };

type AdminTopBarProps = {
  email: string;
  displayName?: string;
};

type AdminSearchFieldProps = {
  query: string;
  setQuery: (value: string) => void;
  results: SearchResult[];
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchFetched: boolean;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResultNavigate?: () => void;
  inputClassName?: string;
};

function AdminSearchField({
  query,
  setQuery,
  results,
  searchOpen,
  setSearchOpen,
  searchFetched,
  onSearchSubmit,
  onResultNavigate,
  inputClassName,
}: AdminSearchFieldProps) {
  const trimmedQuery = query.trim();
  const showDropdown =
    searchOpen && trimmedQuery.length >= 2 && (results.length > 0 || searchFetched);

  return (
    <form className="relative w-full" onSubmit={onSearchSubmit}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-ink-muted)]" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => {
          if (trimmedQuery.length >= 2 && (results.length > 0 || searchFetched)) {
            setSearchOpen(true);
          }
        }}
        onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
        placeholder="Search employees, KPIs, tasks…"
        className={cn(
          "h-11 rounded-[var(--radius-sm)] border-[var(--color-rule)] bg-[var(--color-paper)] pl-10 text-sm shadow-none",
          inputClassName
        )}
      />
      {showDropdown ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-paper)]">
          {results.length > 0 ? (
            results.map((result) => (
              <Link
                key={`${result.group}-${result.href}`}
                href={result.href}
                className="block border-b border-[var(--color-rule)] px-3 py-2 text-sm last:border-b-0 hover:bg-[var(--color-paper-2)]"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                  onResultNavigate?.();
                }}
              >
                <p className="font-medium text-[var(--color-ink)]">{result.label}</p>
                <p className="text-xs text-[var(--color-ink-muted)]">{result.group}</p>
              </Link>
            ))
          ) : (
            <p className="px-3 py-2.5 text-sm text-[var(--color-ink-muted)]">
              No results for &lsquo;{trimmedQuery}&rsquo;
            </p>
          )}
        </div>
      ) : null}
    </form>
  );
}

export function AdminTopBar({ email, displayName }: AdminTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchFetched, setSearchFetched] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isOverview = pathname === "/admin";
  const period =
    searchParams.get("period")?.trim() || new Date().toISOString().slice(0, 7);
  const pageTitle = resolveAdminPageTitle(pathname);

  useEffect(() => {
    const controller = new AbortController();
    const periodParam =
      searchParams.get("period")?.trim() || new Date().toISOString().slice(0, 7);

    void fetch(`/api/hr/overview-notifications?period=${encodeURIComponent(periodParam)}`, {
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
        setSearchFetched(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearchFetched(false);
      try {
        const response = await fetch(
          `/api/hr/search?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          results?: SearchResult[];
        };
        setResults(data.results ?? []);
        setSearchFetched(true);
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
      setMobileSearchOpen(false);
    }
  };

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-40 flex shrink-0 flex-col border-b border-[var(--color-rule)] bg-[var(--color-paper)]">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-1 hidden h-4 sm:block" />
        <div className="min-w-0 flex-1">
          <Breadcrumb>
            <BreadcrumbList>
              {!isOverview ? (
                <>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="/admin">Overview</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                </>
              ) : null}
              <BreadcrumbItem>
                <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="hidden max-w-xs flex-1 justify-center lg:flex">
          <AdminSearchField
            query={query}
            setQuery={setQuery}
            results={results}
            searchOpen={searchOpen}
            setSearchOpen={setSearchOpen}
            searchFetched={searchFetched}
            onSearchSubmit={onSearchSubmit}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {mounted ? (
            <Dialog
              open={mobileSearchOpen}
              onOpenChange={(open) => {
                setMobileSearchOpen(open);
                if (!open) {
                  setSearchOpen(false);
                  setQuery("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-full text-[var(--color-ink-2)] md:hidden"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="gap-4 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-[var(--color-ink)]">Search</DialogTitle>
                </DialogHeader>
                <AdminSearchField
                  query={query}
                  setQuery={setQuery}
                  results={results}
                  searchOpen={searchOpen}
                  setSearchOpen={setSearchOpen}
                  searchFetched={searchFetched}
                  onSearchSubmit={onSearchSubmit}
                  onResultNavigate={closeMobileSearch}
                />
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full text-[var(--color-ink-2)] md:hidden"
              aria-label="Search"
              disabled
            >
              <Search className="h-4 w-4" />
            </Button>
          )}

          <ThemePickerMenu />

          <Button
            asChild
            size="icon"
            variant="ghost"
            className={cn(
              "relative h-10 w-10 rounded-full text-[var(--color-ink-2)]",
              notificationCount > 0 && "text-[var(--color-ink)]"
            )}
          >
            <Link href="/admin#alerts" aria-label="View alerts">
              <Bell className="h-4 w-4" />
              {notificationCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-destructive)] px-1 text-[10px] font-medium text-[var(--color-inverse-ink)]">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              ) : null}
            </Link>
          </Button>

        </div>
      </div>

      {isOverview ? (
        <div className="flex min-h-11 flex-wrap items-center justify-end gap-3 border-t border-[var(--color-rule)] bg-[var(--color-paper-2)] px-4 py-2 sm:px-6">
          <PeriodSelector period={period} />
          <Button
            asChild
            size="sm"
            className="h-9 rounded-[var(--radius-button)] bg-[var(--color-accent)] px-4 text-sm font-medium text-[var(--color-accent-ink)] hover:bg-[var(--color-accent-active)]"
          >
            <Link href="/admin/scores">
              <BarChart3 className="h-3.5 w-3.5" />
              Record scores
            </Link>
          </Button>
        </div>
      ) : null}
    </header>
  );
}
