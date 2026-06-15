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
      className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
