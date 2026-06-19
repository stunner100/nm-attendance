import type { ReactNode } from "react";

import { AdminAppShell } from "@/components/hr/admin-page-shell";
import { requireAdminPage } from "@/lib/admin-auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireAdminPage("/admin");
  const displayName =
    session.user.employeeName?.trim() ||
    session.user.email?.split("@")[0] ||
    "HR Admin";

  return (
    <AdminAppShell email={session.user.email ?? "admin"} displayName={displayName}>
      {children}
    </AdminAppShell>
  );
}
