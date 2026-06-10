import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  low: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  medium: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  high: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  critical: "bg-red-100 text-red-800 hover:bg-red-100",
};

export function RiskBadge({ level }: { level: string }) {
  return (
    <Badge className={cn("capitalize", styles[level] ?? styles.low)}>
      {level} risk
    </Badge>
  );
}

export function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 85 ? "bg-emerald-100 text-emerald-800" :
    score >= 70 ? "bg-blue-100 text-blue-800" :
    "bg-amber-100 text-amber-800";

  return (
    <Badge className={cn("hover:bg-inherit", color)}>
      {score}% confidence
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-blue-100 text-blue-800",
    approved: "bg-emerald-100 text-emerald-800",
    edited: "bg-purple-100 text-purple-800",
    rejected: "bg-red-100 text-red-800",
  };
  return (
    <Badge className={cn("capitalize", styles[status] ?? "")}>
      {status}
    </Badge>
  );
}

export function QualityBadge({ result }: { result: string | null }) {
  if (!result) return null;
  const styles: Record<string, string> = {
    pass: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    block: "bg-red-100 text-red-800",
  };
  return (
    <Badge className={cn("capitalize", styles[result] ?? "")}>
      Quality: {result}
    </Badge>
  );
}
