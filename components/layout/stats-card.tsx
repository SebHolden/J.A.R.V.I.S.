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
    <div className="stripe-card stripe-card-hover p-5">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 text-3xl font-semibold tracking-tight text-foreground",
          variant === "warning" && "text-amber-600",
          variant === "success" && "text-emerald-600"
        )}
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      {subtext && <div className="mt-1 text-xs text-muted-foreground">{subtext}</div>}
    </div>
  );
}
