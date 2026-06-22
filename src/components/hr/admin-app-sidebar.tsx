"use client";

import type { ComponentProps } from "react";

import { AdminBrandHeader } from "@/components/hr/admin-brand-header";
import { AdminNavUser } from "@/components/hr/admin-nav-user";
import { AdminSidebarNav } from "@/components/hr/admin-sidebar-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

type AdminAppSidebarProps = ComponentProps<typeof Sidebar> & {
  email: string;
  displayName: string;
};

export function AdminAppSidebar({ email, displayName, ...props }: AdminAppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AdminBrandHeader />
      </SidebarHeader>
      <SidebarContent>
        <AdminSidebarNav />
      </SidebarContent>
      <SidebarFooter>
        <AdminNavUser name={displayName} email={email} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
