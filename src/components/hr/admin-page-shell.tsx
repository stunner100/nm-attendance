import type { ReactNode } from "react";
import { Suspense } from "react";

import { AdminMobileNav } from "@/components/hr/admin-mobile-nav";
import { AdminTopBar } from "@/components/hr/admin-top-bar";
import { HrAdminNav } from "@/components/hr/admin-nav";

type AdminAppShellProps = {
  email: string;
  children: ReactNode;
};

type AdminPageIntroProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function AdminAppShell({ email, children }: AdminAppShellProps) {
  return (
    <div className="min-h-screen bg-muted text-foreground">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-border bg-card lg:flex">
          <div className="flex items-center gap-3 border-b border-border px-4 py-4">
            <img src="/logo.jpg" alt="Night Market" className="h-9 w-auto rounded-md object-contain" />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold tracking-tight">Night Market</p>
              <p className="text-xs text-muted-foreground">HR Admin</p>
            </div>
          </div>

          <HrAdminNav />

          <div className="mt-auto border-t border-border p-4">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="mt-1 truncate text-sm font-medium">{email}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <div className="lg:hidden">
            <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-card px-4">
              <AdminMobileNav email={email} />
              <img src="/logo.jpg" alt="" className="h-8 w-auto rounded-md object-contain" />
              <p className="truncate font-heading text-sm font-semibold">Night Market</p>
            </div>
          </div>

          <Suspense
            fallback={<div className="h-28 border-b border-border bg-card" aria-hidden="true" />}
          >
            <AdminTopBar email={email} />
          </Suspense>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export function AdminPageIntro({ title, description, actions }: AdminPageIntroProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
