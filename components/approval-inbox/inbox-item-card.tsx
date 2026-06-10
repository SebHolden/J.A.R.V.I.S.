"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge, QualityBadge, RiskBadge, StatusBadge } from "./risk-badge";
import type { ApprovalInboxItem } from "@/lib/types/database";
import { ChevronRight } from "lucide-react";

export function InboxItemCard({ item, compact = false }: { item: ApprovalInboxItem; compact?: boolean }) {
  const clientName = item.clients?.name ?? "Unknown";
  const href = `/approval-inbox/${item.id}`;

  if (compact) {
    return (
      <Link href={href}>
        <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium text-slate-900">{item.title}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              <StatusBadge status={item.status} />
              <ConfidenceBadge score={item.confidence_score} />
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
        </div>
      </Link>
    );
  }

  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base font-medium">{item.title}</CardTitle>
              <p className="mt-1 text-sm text-slate-500">{clientName}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-3 line-clamp-2 text-sm text-slate-600">{item.summary}</p>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            <ConfidenceBadge score={item.confidence_score} />
            <RiskBadge level={item.risk_level} />
            <QualityBadge result={item.quality_result} />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
