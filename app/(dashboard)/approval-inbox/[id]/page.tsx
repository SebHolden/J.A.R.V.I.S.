import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/db/queries";
import { ApprovalActions } from "@/components/approval-inbox/approval-actions";
import { ConfidenceBadge, QualityBadge, RiskBadge, StatusBadge } from "@/components/approval-inbox/risk-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BriefDraft } from "@/lib/types/pipeline";

export default async function ApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return null;

  const { data: item } = await supabase
    .from("approval_inbox_items")
    .select("*, clients(name), projects(title)")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .single();

  if (!item) notFound();

  const brief = item.brief_json as BriefDraft;
  const sources = (item.sources as { type: string; id: string; label: string }[]) ?? [];
  const qualityChecks = (item.quality_checks as { check: string; passed: boolean; detail: string }[]) ?? [];
  const tasks = (item.suggested_tasks as { title: string; priority: string; due_date: string | null; reasoning: string }[]) ?? [];
  const openQuestions = (item.open_questions as string[]) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          <StatusBadge status={item.status} />
          <ConfidenceBadge score={item.confidence_score} />
          <RiskBadge level={item.risk_level} />
          <QualityBadge result={item.quality_result} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{item.title}</h1>
        <p className="mt-1 text-slate-500">{item.summary}</p>
      </div>

      <ApprovalActions item={item} />

      <Separator />

      {sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sources used by AI</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {sources.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{s.type}</span>
                  {s.label}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reply draft</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">
            {item.reply_draft}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Designer brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><span className="font-medium">Client:</span> {brief?.client}</div>
          <div><span className="font-medium">Project:</span> {brief?.project}</div>
          <div><span className="font-medium">Objective:</span> {brief?.objective}</div>
          <div><span className="font-medium">Deliverable:</span> {brief?.deliverable}</div>
          <div><span className="font-medium">Format:</span> {brief?.format_dimensions}</div>
          {brief?.designer_instructions?.length > 0 && (
            <div>
              <span className="font-medium">Instructions:</span>
              <ul className="mt-1 list-disc pl-5">
                {brief.designer_instructions.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suggested tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {tasks.map((t, idx) => (
                <li key={idx} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="font-medium">{t.title}</div>
                  <div className="mt-1 text-slate-500">
                    Priority: {t.priority}
                    {t.due_date && ` · Due: ${t.due_date}`}
                  </div>
                  <div className="mt-1 text-slate-600">{t.reasoning}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {openQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Open questions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {openQuestions.map((q, idx) => (
                <li key={idx}>{q}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quality checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {qualityChecks.map((c, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className={c.passed ? "text-emerald-600" : "text-red-600"}>
                  {c.passed ? "✓" : "✗"}
                </span>
                <div>
                  <div className="font-medium">{c.check}</div>
                  <div className="text-slate-500">{c.detail}</div>
                </div>
              </li>
            ))}
          </ul>
          {item.blocked_reason && (
            <p className="mt-4 text-sm text-red-600">Blocked: {item.blocked_reason}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
