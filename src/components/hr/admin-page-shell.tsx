import type { ReactNode } from "react";

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
    <div className="relative min-h-screen bg-neutral-100 text-neutral-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(15,23,42,0.08),transparent_28%)]" />
      <div className="relative flex min-h-screen">
        <aside className="fixed inset-y-3 left-3 z-50 hidden w-72 flex-col overflow-hidden rounded-4xl bg-gray-100 p-2 shadow-[inset_0_1px_0_0_var(--color-gray-200),inset_0_2px_0_0_rgba(255,255,255,0.95),0_24px_80px_rgba(15,23,42,0.1)] lg:flex">
          <div className="flex items-center gap-3 rounded-[24px] bg-white px-4 py-4 shadow-[inset_0_1px_3px_rgba(15,23,42,0.035)] ring-1 ring-neutral-200/70">
            <img src="/logo.jpg" alt="Logo" className="h-9 w-auto rounded-lg object-contain" />
            <div>
              <p className="text-sm font-semibold tracking-tight text-neutral-950">Abonten Technologies</p>
              <p className="text-xs font-medium text-neutral-500">Admin Portal</p>
            </div>
          </div>

          <HrAdminNav />

          <div className="mt-auto p-2">
            <div className="rounded-[24px] bg-white p-4 shadow-[inset_0_1px_3px_rgba(15,23,42,0.035)] ring-1 ring-neutral-200/70">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Signed in as</p>
              <p className="mt-1 truncate text-sm font-semibold text-neutral-950">{email}</p>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col lg:ml-[19.5rem]">
          <header className="sticky top-0 z-40 px-3 pt-3">
            <div className="flex h-16 items-center justify-between rounded-[28px] border border-white/70 bg-white/75 px-4 shadow-sm backdrop-blur-xl sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 lg:hidden">
                <img src="/logo.jpg" alt="Logo" className="h-8 w-auto rounded-lg object-contain" />
                <p className="text-sm font-semibold text-neutral-950">Abonten Technologies</p>
              </div>

              <div className="hidden lg:block" />

              <div className="flex items-center gap-3">
                <LogoutButton />
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export function AdminPageIntro({ title, description, actions }: AdminPageIntroProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-4xl bg-white/70 p-2 shadow-sm ring-1 ring-white/70 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="rounded-[24px] px-4 py-3">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm font-medium text-neutral-500">{description}</p>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 px-2 pb-2 sm:pb-0">{actions}</div>}
    </div>
  );
}
