"use client";

import { Menu } from "lucide-react";

import { HrAdminNav } from "@/components/hr/admin-nav";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AdminMobileNavProps = {
  email: string;
};

export function AdminMobileNav({ email }: AdminMobileNavProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 p-0 sm:max-w-sm">
        <DialogHeader className="border-b border-border px-4 py-4 text-left">
          <DialogTitle className="font-heading text-base">Navigation</DialogTitle>
          <p className="truncate text-sm text-muted-foreground">{email}</p>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          <HrAdminNav />
        </div>
      </DialogContent>
    </Dialog>
  );
}
