import type { ReactNode } from "react";
import { Suspense } from "react";

import { AdminTopBar } from "@/components/hr/admin-top-bar";
import { HrAdminNav } from "@/components/hr/admin-nav";
import { BrandLogo } from "@/components/hr/brand-logo";
import { cn } from "@/lib/utils";

type AdminAppShellProps = {
  email: string;
  displayName?: string;
  children: ReactNode;
};

type AdminPageIntroProps = {
  title?: string;
  description: string;
  actions?: ReactNode;
  /** When false (default), only description + actions render — AdminTopBar already shows the page title. */
  showTitle?: boolean;
};

export function AdminAppShell({ email, displayName, children }: AdminAppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-paper-2)] text-[var(--color-ink)]">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-60 flex-col border-r border-[var(--color-rule)] bg-[var(--color-paper)] md:flex">
          <div className="flex h-16 items-center gap-3 border-b border-[var(--color-rule)] px-5">
            <BrandLogo className="h-8 w-8 rounded-full object-cover object-left" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-ink)]">Abonten Technologies</p>
              <p className="truncate text-xs text-[var(--color-ink-muted)]">HR workspace</p>
            </div>
          </div>

          <HrAdminNav />

          <div className="mt-auto border-t border-[var(--color-rule)] p-4">
            <p className="text-xs text-[var(--color-ink-muted)]">Performance & people ops</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col md:ml-60">
          <Suspense
            fallback={
              <div className="h-16 border-b border-[var(--color-rule)] bg-[var(--color-paper)]" aria-hidden="true" />
            }
          >
            <AdminTopBar email={email} displayName={displayName} />
          </Suspense>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function AdminPageIntro({
  title,
  description,
  actions,
  showTitle = false,
}: AdminPageIntroProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-[var(--color-rule)] pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {showTitle && title ? (
          <h2 className="text-xl font-medium tracking-tight text-[var(--color-ink)] sm:text-2xl">
            {title}
          </h2>
        ) : null}
        <p
          className={cn(
            "max-w-3xl text-sm text-[var(--color-ink-muted)]",
            showTitle && title ? "mt-1" : undefined
          )}
        >
          {description}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
