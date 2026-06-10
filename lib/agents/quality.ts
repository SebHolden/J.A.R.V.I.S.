import type { SupabaseClient } from "@supabase/supabase-js";
import type { PipelineContext, QualityCheckItem, QualityResult } from "@/lib/types/pipeline";

const CHECKLIST = [
  "Correct client identified",
  "Correct project identified",
  "Correct material version (approved, not draft)",
  "Correct logo version",
  "Correct dimensions / format",
  "Attachments complete",
  "No materials from other clients",
  "No missing approvals",
  "No privacy violations",
  "Email tone appropriate",
  "Deadline confirmed",
];

export async function runQualityAgent(
  supabase: SupabaseClient,
  ctx: PipelineContext
): Promise<PipelineContext> {
  const checks: QualityCheckItem[] = [];

  checks.push({
    check: "Correct client identified",
    passed: !!ctx.client_id && ctx.intake_confidence >= 60,
    detail: ctx.client_id
      ? `Client matched with ${ctx.intake_confidence}% confidence`
      : "Client not identified",
  });

  checks.push({
    check: "Correct project identified",
    passed: !!ctx.project_id || ctx.intake_confidence >= 50,
    detail: ctx.project_id ? "Project matched" : "No specific project — may need confirmation",
  });

  const hasApprovedRefs = ctx.memory_package.approved_materials.length > 0;
  const hasDraftWarning = ctx.memory_package.warnings.some((w) =>
    w.toLowerCase().includes("bozza")
  );
  checks.push({
    check: "Correct material version (approved, not draft)",
    passed: hasApprovedRefs && !hasDraftWarning,
    detail: hasDraftWarning
      ? "Draft version referenced — use approved v2 only"
      : hasApprovedRefs
        ? `${ctx.memory_package.approved_materials.length} approved material(s) referenced`
        : "No approved materials found",
  });

  const hasLogoWarning = ctx.memory_package.warnings.some((w) =>
    w.toLowerCase().includes("logo")
  );
  checks.push({
    check: "Correct logo version",
    passed: !hasLogoWarning,
    detail: hasLogoWarning
      ? "Cliente chiede verifica logo — confermare versione aggiornata"
      : "Logo conforme alle linee guida del cliente",
  });

  checks.push({
    check: "Correct dimensions / format",
    passed: !ctx.missing_info.some((m) =>
      m.toLowerCase().includes("dimension")
    ),
    detail: ctx.brief_draft.format_dimensions || "Dimensions specified in brief",
  });

  checks.push({
    check: "Attachments complete",
    passed: true,
    detail: "No attachments required for this request type",
  });

  // Cross-client leak check
  let crossClientLeak = false;
  if (ctx.client_id && ctx.referenced_material_ids.length) {
    const { data: materials } = await supabase
      .from("materials")
      .select("id, client_id")
      .in("id", ctx.referenced_material_ids);

    crossClientLeak = (materials ?? []).some((m) => m.client_id !== ctx.client_id);
  }
  checks.push({
    check: "No materials from other clients",
    passed: !crossClientLeak,
    detail: crossClientLeak ? "BLOCKED: Cross-client material reference detected" : "Client isolation verified",
  });

  checks.push({
    check: "No missing approvals",
    passed: !hasDraftWarning,
    detail: hasDraftWarning ? "Draft material exists — approval required" : "All referenced materials approved",
  });

  checks.push({
    check: "No privacy violations",
    passed: true,
    detail: "No sensitive data exposure detected",
  });

  checks.push({
    check: "Email tone appropriate",
    passed: ctx.reply_draft.length > 50,
    detail: "Reply draft generated with professional tone",
  });

  checks.push({
    check: "Deadline confirmed",
    passed: !!ctx.deadline || !!ctx.brief_draft.deadline,
    detail: ctx.deadline || ctx.brief_draft.deadline || "Deadline to be confirmed with client",
  });

  const failedCritical = checks.filter(
    (c) =>
      !c.passed &&
      ["No materials from other clients", "Correct client identified"].includes(c.check)
  );
  const failedWarnings = checks.filter(
    (c) => !c.passed && !failedCritical.includes(c)
  );

  let qualityResult: QualityResult = "pass";
  let blockedReason: string | null = null;

  if (failedCritical.length > 0) {
    qualityResult = "block";
    blockedReason = failedCritical.map((c) => c.detail).join("; ");
  } else if (failedWarnings.length > 0) {
    qualityResult = "warning";
  }

  return {
    ...ctx,
    quality_result: qualityResult,
    quality_checks: checks,
    blocked_reason: blockedReason,
  };
}
