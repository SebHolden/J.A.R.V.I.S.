import type { SupabaseClient } from "@supabase/supabase-js";
import type { PipelineContext, LearningRecordRef } from "@/lib/types/pipeline";

export async function runLearningAgent(
  supabase: SupabaseClient,
  ctx: PipelineContext
): Promise<PipelineContext> {
  if (!ctx.client_id) {
    return {
      ...ctx,
      predicted_edit_probability: 0.5,
      recommended_tone_adjustments: [],
      similar_past_cases: [],
    };
  }

  const { data: records } = await supabase
    .from("learning_records")
    .select("id, event_type, outcome, human_edit_diff, input_snapshot")
    .eq("agency_id", ctx.agency_id)
    .eq("client_id", ctx.client_id)
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: patterns } = await supabase
    .from("learning_patterns")
    .select("pattern_data, strength")
    .eq("agency_id", ctx.agency_id)
    .eq("client_id", ctx.client_id)
    .eq("pattern_type", "tone_adjustment")
    .limit(1);

  const similarPastCases: LearningRecordRef[] = (records ?? []).map((r) => ({
    id: r.id,
    event_type: r.event_type,
    outcome: r.outcome,
    human_edit_diff: r.human_edit_diff,
  }));

  const editedCount = (records ?? []).filter((r) => r.outcome === "edited").length;
  const totalCount = records?.length ?? 0;
  const baseProbability = totalCount > 0 ? editedCount / totalCount : 0.4;

  const patternStrength = patterns?.[0]?.strength ?? 0;
  const predictedEditProbability = Math.min(
    0.95,
    baseProbability * 0.6 + patternStrength * 0.4
  );

  const toneAdjustments: string[] = [];
  if (patterns?.[0]?.pattern_data) {
    const data = patterns[0].pattern_data as { adjustments?: string[] };
    toneAdjustments.push(...(data.adjustments ?? []));
  }

  const learningSources = similarPastCases.slice(0, 3).map((r) => ({
    type: "learning_record" as const,
    id: r.id,
    label: `Past ${r.event_type}: ${r.outcome}`,
  }));

  return {
    ...ctx,
    similar_past_cases: similarPastCases,
    predicted_edit_probability: Math.round(predictedEditProbability * 100) / 100,
    recommended_tone_adjustments: toneAdjustments,
    sources: [...ctx.sources, ...learningSources],
  };
}
