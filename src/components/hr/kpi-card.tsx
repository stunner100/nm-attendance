import { Card, CardContent, CardHeader } from "@/components/ui/card";

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function KpiCard({ label, value, hint }: KpiCardProps) {
  return (
    <Card className="h-full shadow-none">
      <CardHeader className="pb-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-medium tabular-nums tracking-tight text-foreground">{value}</p>
        {hint ? <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
