import type { SupabaseClient } from "@supabase/supabase-js";
import { structuredCompletion } from "@/lib/ai/openai";
import type { PipelineContext, BriefDraft, SuggestedTask } from "@/lib/types/pipeline";
import { isLegnanoTestMode, legnanoAccountFixture } from "./test-mode";

interface AccountResult {
  reply_draft: string;
  brief_draft: BriefDraft;
  suggested_tasks: SuggestedTask[];
  open_questions: string[];
  account_confidence: number;
}

export async function runAccountAgent(
  supabase: SupabaseClient,
  ctx: PipelineContext
): Promise<{ ctx: PipelineContext; tokensUsed: number }> {
  if (isLegnanoTestMode()) {
    const fixture = legnanoAccountFixture();
    return {
      ctx: {
        ...ctx,
        reply_draft: fixture.reply_draft,
        brief_draft: fixture.brief_draft,
        suggested_tasks: fixture.suggested_tasks,
        open_questions: fixture.open_questions,
        account_confidence: fixture.account_confidence,
      },
      tokensUsed: 0,
    };
  }

  const systemPrompt = `You are the Account Agent for AgencyPilot — a senior Italian account manager at a marketing agency.
Generate professional outputs in Italian for the client request.

Apply these tone adjustments from the Learning Agent:
${ctx.recommended_tone_adjustments.map((a) => `- ${a}`).join("\n")}

Predicted edit probability: ${ctx.predicted_edit_probability} — be extra careful if high.

Respond in JSON:
- reply_draft: professional email reply in Italian (concise, clear, agency style)
- brief_draft: complete designer brief object with fields: client, project, objective, target_audience, deliverable, format_dimensions, materials_to_use (array), copy_needed, references (array), deadline, open_questions (array), risks (array), designer_instructions (array)
- suggested_tasks: array of {title, priority, due_date, reasoning}
- open_questions: array of strings
- account_confidence: 0-100

Always cite approved materials from memory. Never reference draft materials as approved.
For vetrofania adaptation requests: explicitly name Legnano (or other source sede) as template and Bergamo (or target sede) as destination in the brief.`;

  const userPrompt = `REQUEST: ${ctx.raw_input}
INTENT: ${ctx.intent}
URGENCY: ${ctx.urgency}
DEADLINE: ${ctx.deadline}
MISSING INFO: ${JSON.stringify(ctx.missing_info)}

BRAND GUIDELINES:
${JSON.stringify(ctx.memory_package.brand_guidelines, null, 2)}

APPROVED MATERIALS:
${JSON.stringify(ctx.memory_package.approved_materials, null, 2)}

PAST DECISIONS:
${JSON.stringify(ctx.memory_package.past_decisions, null, 2)}

CONTACT PREFERENCES:
${JSON.stringify(ctx.memory_package.contact_preferences, null, 2)}

RECENT PROJECTS:
${JSON.stringify(ctx.memory_package.recent_projects, null, 2)}

WARNINGS:
${JSON.stringify(ctx.memory_package.warnings, null, 2)}

SIMILAR PAST CASES:
${JSON.stringify(ctx.similar_past_cases, null, 2)}`;

  const { result, tokensUsed } = await structuredCompletion<AccountResult>(
    systemPrompt,
    userPrompt,
    "gpt-4o",
    {
      agencyId: ctx.agency_id,
      clientId: ctx.client_id,
      pipelineRunId: ctx.request_id,
      supabase,
    }
  );

  return {
    ctx: {
      ...ctx,
      reply_draft: result.reply_draft,
      brief_draft: result.brief_draft,
      suggested_tasks: result.suggested_tasks ?? [],
      open_questions: result.open_questions ?? [],
      account_confidence: result.account_confidence ?? 75,
    },
    tokensUsed,
  };
}
