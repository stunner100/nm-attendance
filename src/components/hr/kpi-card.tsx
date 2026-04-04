import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  color?: "emerald" | "blue" | "amber" | "red" | "purple" | "cyan" | "indigo" | "rose";
};

const colorMap = {
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600" },
  blue: { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-600" },
  amber: { bg: "bg-amber-50", icon: "bg-amber-100 text-amber-600" },
  red: { bg: "bg-red-50", icon: "bg-red-100 text-red-600" },
  purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-600" },
  cyan: { bg: "bg-cyan-50", icon: "bg-cyan-100 text-cyan-600" },
  indigo: { bg: "bg-indigo-50", icon: "bg-indigo-100 text-indigo-600" },
  rose: { bg: "bg-rose-50", icon: "bg-rose-100 text-rose-600" },
};

export function KpiCard({ label, value, hint, icon: Icon, color = "emerald" }: KpiCardProps) {
  const colors = colorMap[color];

  return (
    <Card className="h-full border-0 shadow-md transition-shadow hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {Icon && (
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", colors.icon)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="mt-1.5 text-sm text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
