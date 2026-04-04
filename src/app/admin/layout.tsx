import type { ReactNode } from "react";

import { AdminAppShell } from "@/components/hr/admin-page-shell";
import { requireAdminPage } from "@/lib/admin-auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireAdminPage("/admin");

  return <AdminAppShell email={session.user.email ?? "admin"}>{children}</AdminAppShell>;
}
