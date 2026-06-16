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
    <div className="min-h-screen bg-[#f8fafc] text-[#111827]">
      <div className="flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-[228px] flex-col bg-[#061427] text-white shadow-[12px_0_32px_rgba(15,23,42,0.18)] lg:flex">
          <div className="flex h-[74px] items-center gap-3 border-b border-white/10 px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#ffd400] text-[#ffd400]">
              <img src="/logo.jpg" alt="" className="h-5 w-5 rounded-full object-cover object-left" />
            </div>
            <p className="font-heading text-base leading-[1.05] font-bold text-[#ffd400]">
              Night
              <br />
              Market
            </p>
          </div>

          <HrAdminNav />

          <div className="mt-auto border-t border-white/10 p-4">
            <button className="flex items-center gap-3 text-sm text-white/80 transition-colors hover:text-white">
              <span className="text-lg leading-none">‹</span>
              <span>Collapse</span>
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:ml-[228px]">
          <div className="lg:hidden">
            <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-[#e5e7eb] bg-white px-4">
              <AdminMobileNav email={email} />
              <img src="/logo.jpg" alt="" className="h-8 w-auto rounded-md object-contain" />
              <p className="truncate font-heading text-sm font-semibold">Night Market</p>
            </div>
          </div>

          <Suspense
            fallback={<div className="h-20 border-b border-[#e5e7eb] bg-white" aria-hidden="true" />}
          >
            <AdminTopBar email={email} />
          </Suspense>

          <main className="min-w-0 flex-1 px-4 py-0 sm:px-5 lg:px-4">{children}</main>
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
