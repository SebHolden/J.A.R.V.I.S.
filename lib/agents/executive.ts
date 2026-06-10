import type { SupabaseClient } from "@supabase/supabase-js";
import type { PipelineContext, RiskLevel } from "@/lib/types/pipeline";

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function computePriority(ctx: PipelineContext): number {
  let priority = 50;
  if (ctx.urgency === "critical") priority += 40;
  else if (ctx.urgency === "high") priority += 25;
  else if (ctx.urgency === "medium") priority += 10;
  if (ctx.quality_result === "block") priority += 30;
  else if (ctx.quality_result === "warning") priority += 15;
  priority += Math.round(ctx.account_confidence * 0.1);
  return Math.min(100, priority);
}

export async function runExecutiveAgent(
  supabase: SupabaseClient,
  ctx: PipelineContext
): Promise<PipelineContext> {
  const { data: policies } = await supabase
    .from("autonomy_policies")
    .select("*")
    .eq("agency_id", ctx.agency_id)
    .eq("enabled", true);

  const autonomousEligible = (policies ?? []).length > 0 && ctx.quality_result === "pass";
  const requiresHuman = true; // V1: always require human approval

  const confidence = Math.round(
    (ctx.intake_confidence * 0.3 + ctx.account_confidence * 0.7) *
      (ctx.quality_result === "pass" ? 1 : ctx.quality_result === "warning" ? 0.85 : 0.5)
  );

  const riskLevel = scoreToRiskLevel(ctx.risk_score);
  const priority = computePriority(ctx);

  let clientName = "Unknown client";
  if (ctx.client_id) {
    const { data: client } = await supabase
      .from("clients")
      .select("name")
      .eq("id", ctx.client_id)
      .single();
    clientName = client?.name ?? clientName;
  }

  const title = `${clientName}: ${ctx.intent.slice(0, 80)}`;
  const summary = `Reply draft and designer brief ready for review. Quality: ${ctx.quality_result}. Confidence: ${confidence}%.`;

  const inboxType =
    ctx.quality_result === "block"
      ? "risk"
      : ctx.missing_info.length > 2
        ? "missing_material"
        : "email_reply";

  const { data: inboxItem, error } = await supabase
    .from("approval_inbox_items")
    .insert({
      agency_id: ctx.agency_id,
      request_id: ctx.request_id,
      client_id: ctx.client_id,
      project_id: ctx.project_id,
      type: inboxType,
      status: "pending",
      title,
      summary,
      reply_draft: ctx.reply_draft,
      brief_json: ctx.brief_draft,
      suggested_tasks: ctx.suggested_tasks,
      open_questions: ctx.open_questions,
      confidence_score: confidence,
      risk_level: riskLevel,
      sources: ctx.sources,
      quality_result: ctx.quality_result,
      quality_checks: ctx.quality_checks,
      blocked_reason: ctx.blocked_reason,
      priority,
      pipeline_context: ctx,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Executive Agent failed: ${error.message}`);

  return {
    ...ctx,
    inbox_item_ids: [inboxItem.id],
    requires_human: requiresHuman,
    autonomous_eligible: autonomousEligible,
  };
}
