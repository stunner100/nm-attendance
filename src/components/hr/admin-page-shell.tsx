import type { ReactNode } from "react";

import { AdminMobileNav } from "@/components/hr/admin-mobile-nav";
import { LogoutButton } from "@/components/logout-button";
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
            <img src="/logo.jpg" alt="Abonten Technologies" className="h-9 w-auto rounded-md object-contain" />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold tracking-tight">Abonten Technologies</p>
              <p className="text-xs text-muted-foreground">Admin portal</p>
            </div>
          </div>

          <HrAdminNav />

          <div className="mt-auto border-t border-border p-4">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="mt-1 truncate text-sm font-medium">{email}</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <header className="sticky top-0 z-40 border-b border-border bg-card">
            <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <AdminMobileNav email={email} />
                <div className="flex min-w-0 items-center gap-3 lg:hidden">
                  <img src="/logo.jpg" alt="" className="h-8 w-auto rounded-md object-contain" />
                  <p className="truncate font-heading text-sm font-semibold">Abonten</p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </header>

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
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
