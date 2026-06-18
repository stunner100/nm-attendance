"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  iconOnly?: boolean;
  className?: string;
};

export function LogoutButton({ iconOnly = false, className }: LogoutButtonProps) {
  const [submitting, setSubmitting] = useState(false);

  const onClick = async () => {
    setSubmitting(true);
    await signOut({ callbackUrl: "/login" });
  };

  if (iconOnly) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={onClick}
        disabled={submitting}
        aria-label="Sign out"
        className={cn(
          "h-9 w-9 shrink-0 rounded-[var(--radius-sm)] border-[var(--color-rule)] bg-[var(--color-paper)] text-[var(--color-ink-2)]",
          className
        )}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={submitting}
      className={cn(
        "h-9 rounded-[var(--radius-sm)] border-[var(--color-rule)] bg-[var(--color-paper)] text-xs font-medium whitespace-nowrap",
        className
      )}
    >
      {submitting ? "Signing out…" : "Sign out"}
    </Button>
  );
}
