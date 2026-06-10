import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatsCard({
  label,
  value,
  subtext,
  variant = "default",
}: {
  label: string;
  value: string | number;
  subtext?: string;
  variant?: "default" | "warning" | "success";
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="text-sm text-slate-500">{label}</div>
        <div
          className={cn(
            "mt-1 text-3xl font-semibold tracking-tight",
            variant === "warning" && "text-amber-600",
            variant === "success" && "text-emerald-600"
          )}
        >
          {value}
        </div>
        {subtext && <div className="mt-1 text-xs text-slate-400">{subtext}</div>}
      </CardContent>
    </Card>
  );
}
