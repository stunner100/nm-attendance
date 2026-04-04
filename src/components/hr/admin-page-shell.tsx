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
    <div className="relative min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
              <span className="text-sm font-bold text-white">NM</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">HR System</p>
              <p className="text-xs text-slate-500">Admin Portal</p>
            </div>
          </div>

          <HrAdminNav />

          <div className="mt-auto border-t border-slate-200 p-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">Signed in as</p>
              <p className="mt-1 truncate text-sm font-medium text-slate-900">{email}</p>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col lg:ml-64">
          <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 lg:hidden">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600">
                  <span className="text-sm font-bold text-white">NM</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">HR System</p>
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
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
