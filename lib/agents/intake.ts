import type { SupabaseClient } from "@supabase/supabase-js";
import { structuredCompletion } from "@/lib/ai/openai";
import type { PipelineContext, UrgencyLevel } from "@/lib/types/pipeline";
import { isLegnanoTestMode, legnanoIntakeFixture } from "./test-mode";
import { validateIntakeIds } from "./validate-intake";

interface IntakeResult {
  client_id: string | null;
  client_name: string | null;
  contact_id: string | null;
  project_id: string | null;
  intent: string;
  urgency: UrgencyLevel;
  deadline: string | null;
  missing_info: string[];
  referenced_material_ids: string[];
  risk_score: number;
  intake_confidence: number;
}

export async function runIntakeAgent(
  supabase: SupabaseClient,
  ctx: PipelineContext
): Promise<{ ctx: PipelineContext; tokensUsed: number }> {
  if (isLegnanoTestMode()) {
    const fixture = legnanoIntakeFixture(ctx.raw_input);
    return {
      ctx: { ...ctx, ...fixture },
      tokensUsed: 0,
    };
  }

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, sector, description")
    .eq("agency_id", ctx.agency_id);

  const { data: projects } = await supabase
    .from("projects")
    .select("id, client_id, title, description, deadline")
    .in("client_id", (clients ?? []).map((c) => c.id));

  const { data: materials } = await supabase
    .from("materials")
    .select("id, client_id, title, file_type")
    .eq("agency_id", ctx.agency_id);

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, client_id, name, email, role")
    .in("client_id", (clients ?? []).map((c) => c.id));

  const systemPrompt = `You are the Intake Agent for AgencyPilot, an AI account manager for marketing agencies.
Analyze the client request and match it to the correct client, contact, and project from the provided data.
Respond in JSON with these fields:
- client_id, client_name, contact_id, project_id (UUIDs from data, or null)
- intent: clear description of what the client wants
- urgency: low|medium|high|critical
- deadline: ISO date string or null
- missing_info: array of missing information strings
- referenced_material_ids: array of material UUIDs referenced or implied
- risk_score: 0-100
- intake_confidence: 0-100

Be precise with Italian client requests. SYNLAB requests about vetrofanie/flyer/prevenzione should match SYNLAB.`;

  const userPrompt = `REQUEST:
${ctx.raw_input}

CLIENTS:
${JSON.stringify(clients, null, 2)}

CONTACTS:
${JSON.stringify(contacts, null, 2)}

PROJECTS:
${JSON.stringify(projects, null, 2)}

MATERIALS:
${JSON.stringify(materials, null, 2)}`;

  const { result, tokensUsed } = await structuredCompletion<IntakeResult>(
    systemPrompt,
    userPrompt,
    "gpt-4o",
    {
      agencyId: ctx.agency_id,
      pipelineRunId: ctx.request_id,
      supabase,
    }
  );

  const validated = validateIntakeIds(
    {
      client_id: result.client_id,
      contact_id: result.contact_id,
      project_id: result.project_id,
      referenced_material_ids: result.referenced_material_ids ?? [],
    },
    clients ?? [],
    contacts ?? [],
    projects ?? [],
    materials ?? []
  );

  const validUrgencies: UrgencyLevel[] = ["low", "medium", "high", "critical"];
  const urgency = validUrgencies.includes(result.urgency) ? result.urgency : "medium";

  return {
    ctx: {
      ...ctx,
      client_id: validated.client_id,
      contact_id: validated.contact_id,
      project_id: validated.project_id,
      intent: result.intent ?? "",
      urgency,
      deadline: result.deadline,
      missing_info: result.missing_info ?? [],
      referenced_material_ids: validated.referenced_material_ids,
      risk_score: result.risk_score ?? 30,
      intake_confidence: validated.client_id
        ? Math.min(result.intake_confidence ?? 70, 100)
        : Math.min(result.intake_confidence ?? 70, 40),
    },
    tokensUsed,
  };
}
