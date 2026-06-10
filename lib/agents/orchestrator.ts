import type { SupabaseClient } from "@supabase/supabase-js";
import { runIntakeAgent } from "./intake";
import { runMemoryAgent } from "./memory";
import { runLearningAgent } from "./learning";
import { runAccountAgent } from "./account";
import { runQualityAgent } from "./quality";
import { runExecutiveAgent } from "./executive";
import { createEmptyContext, type AgentStep, type PipelineContext } from "@/lib/types/pipeline";

async function logAgentAction(
  supabase: SupabaseClient,
  agencyId: string,
  userId: string | null,
  agent: AgentStep,
  requestId: string,
  input: string,
  output: string,
  tokensUsed?: number
) {
  await supabase.from("audit_logs").insert({
    agency_id: agencyId,
    user_id: userId,
    action: `agent_${agent}_completed`,
    entity_type: "client_request",
    entity_id: requestId,
    metadata: { agent, tokens_used: tokensUsed },
  });

  if (tokensUsed) {
    await supabase.from("ai_outputs").insert({
      agency_id: agencyId,
      type: `agent_${agent}`,
      input: input.slice(0, 5000),
      output: output.slice(0, 10000),
      model: "gpt-4o",
      tokens_used: tokensUsed,
    });
  }
}

export async function runPipeline(
  supabase: SupabaseClient,
  agencyId: string,
  userId: string | null,
  rawInput: string,
  onStep?: (step: AgentStep) => void
): Promise<{ context: PipelineContext; inboxItemId: string }> {
  const { data: request, error: reqError } = await supabase
    .from("client_requests")
    .insert({
      agency_id: agencyId,
      user_id: userId,
      raw_input: rawInput,
      status: "processing",
    })
    .select("id")
    .single();

  if (reqError || !request) throw new Error(`Failed to create request: ${reqError?.message}`);

  let ctx = createEmptyContext(request.id, agencyId, userId, rawInput);

  try {
    onStep?.("intake");
    const intakeResult = await runIntakeAgent(supabase, ctx);
    ctx = intakeResult.ctx;
    await logAgentAction(
      supabase, agencyId, userId, "intake", request.id,
      rawInput, JSON.stringify({ intent: ctx.intent, client_id: ctx.client_id }),
      intakeResult.tokensUsed
    );

    onStep?.("memory");
    ctx = await runMemoryAgent(supabase, ctx);
    await logAgentAction(
      supabase, agencyId, userId, "memory", request.id,
      ctx.client_id ?? "", JSON.stringify(ctx.memory_package)
    );

    onStep?.("learning");
    ctx = await runLearningAgent(supabase, ctx);
    await logAgentAction(
      supabase, agencyId, userId, "learning", request.id,
      ctx.client_id ?? "", JSON.stringify({
        predicted_edit_probability: ctx.predicted_edit_probability,
        adjustments: ctx.recommended_tone_adjustments,
      })
    );

    onStep?.("account");
    const accountResult = await runAccountAgent(supabase, ctx);
    ctx = accountResult.ctx;
    await logAgentAction(
      supabase, agencyId, userId, "account", request.id,
      ctx.intent, JSON.stringify({ reply: ctx.reply_draft, brief: ctx.brief_draft }),
      accountResult.tokensUsed
    );

    onStep?.("quality");
    ctx = await runQualityAgent(supabase, ctx);
    await logAgentAction(
      supabase, agencyId, userId, "quality", request.id,
      ctx.reply_draft.slice(0, 500), JSON.stringify(ctx.quality_checks)
    );

    onStep?.("executive");
    ctx = await runExecutiveAgent(supabase, ctx);
    await logAgentAction(
      supabase, agencyId, userId, "executive", request.id,
      "", JSON.stringify({ inbox_item_ids: ctx.inbox_item_ids })
    );

    await supabase
      .from("client_requests")
      .update({
        status: "completed",
        pipeline_context: ctx,
        completed_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    return {
      context: ctx,
      inboxItemId: ctx.inbox_item_ids[0],
    };
  } catch (err) {
    await supabase
      .from("client_requests")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown error",
      })
      .eq("id", request.id);
    throw err;
  }
}
