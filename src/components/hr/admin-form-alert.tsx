import { AlertTriangle } from "lucide-react";

type AdminFormAlertProps = {
  message?: string | null;
};

export function AdminFormAlert({ message }: AdminFormAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-signature-yellow)]/30 px-4 py-3 text-sm text-foreground"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
