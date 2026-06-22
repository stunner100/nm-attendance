import type { ReactNode } from "react";
import { Suspense } from "react";

import { AdminAppSidebar } from "@/components/hr/admin-app-sidebar";
import { AdminTopBar } from "@/components/hr/admin-top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
  const resolvedDisplayName = displayName?.trim() || "HR Admin";

  return (
    <SidebarProvider>
      <AdminAppSidebar email={email} displayName={resolvedDisplayName} />
      <SidebarInset>
        <Suspense
          fallback={
            <div className="h-16 border-b border-[var(--color-rule)] bg-[var(--color-paper)]" aria-hidden="true" />
          }
        >
          <AdminTopBar email={email} displayName={resolvedDisplayName} />
        </Suspense>

        <main className="flex flex-1 flex-col gap-4 p-4 pt-0 sm:px-6 sm:py-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
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
