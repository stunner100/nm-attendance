import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type AdminFormAlertProps = {
  message?: string | null;
  variant?: "error" | "success";
};

export function AdminFormAlert({ message, variant = "error" }: AdminFormAlertProps) {
  if (!message) {
    return null;
  }

  const isSuccess = variant === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;

  return (
    <div
      role="alert"
      className={cn(
        "mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm",
        isSuccess
          ? "border-[var(--color-rule)] bg-[var(--color-signature-mint)]/40 text-[var(--color-success)]"
          : "border-[var(--color-rule)] bg-[var(--color-signature-yellow)]/30 text-foreground"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
