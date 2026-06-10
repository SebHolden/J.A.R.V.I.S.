import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";

const OPENAI_TIMEOUT_MS = 60_000;

const MODEL_COST_PER_1M: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.5, out: 10 },
  "text-embedding-3-small": { in: 0.02, out: 0 },
};

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: OPENAI_TIMEOUT_MS,
    });
  }
  return client;
}

function estimateCostUsd(model: string, tokensIn: number, tokensOut: number): number {
  const rates = MODEL_COST_PER_1M[model] ?? MODEL_COST_PER_1M["gpt-4o"];
  return (tokensIn * rates.in + tokensOut * rates.out) / 1_000_000;
}

function parseJsonResponse<T>(content: string): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }
}

export interface CallAIOptions {
  agencyId: string;
  clientId?: string | null;
  pipelineRunId?: string | null;
  supabase?: SupabaseClient;
}

export async function callAI<T>(
  systemPrompt: string,
  userPrompt: string,
  options: CallAIOptions & { responseFormat: "json" },
  model?: string
): Promise<{ result: T; tokensUsed: number; tokensIn: number; tokensOut: number }>;

export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options: CallAIOptions & { responseFormat?: "text" },
  model?: string
): Promise<{ result: string; tokensUsed: number; tokensIn: number; tokensOut: number }>;

export async function callAI<T = string>(
  systemPrompt: string,
  userPrompt: string,
  options: CallAIOptions & { responseFormat?: "json" | "text" },
  model = "gpt-4o"
): Promise<{ result: T | string; tokensUsed: number; tokensIn: number; tokensOut: number }> {
  const openai = getOpenAI();
  const useJson = options.responseFormat === "json";

  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    ...(useJson ? { response_format: { type: "json_object" as const } } : {}),
    temperature: useJson ? 0.3 : 0.4,
  });

  const content = response.choices[0]?.message?.content ?? (useJson ? "{}" : "");
  const tokensIn = response.usage?.prompt_tokens ?? 0;
  const tokensOut = response.usage?.completion_tokens ?? 0;
  const tokensUsed = tokensIn + tokensOut;

  if (options.supabase) {
    await options.supabase.from("ai_costs").insert({
      agency_id: options.agencyId,
      client_id: options.clientId ?? null,
      model,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      estimated_cost_usd: estimateCostUsd(model, tokensIn, tokensOut),
      pipeline_run_id: options.pipelineRunId ?? null,
    });
  }

  const result = useJson ? parseJsonResponse<T>(content) : content;
  return { result, tokensUsed, tokensIn, tokensOut };
}

export async function createEmbedding(
  text: string,
  options: CallAIOptions
): Promise<{ embedding: number[]; tokensUsed: number }> {
  const openai = getOpenAI();
  const model = "text-embedding-3-small";
  const response = await openai.embeddings.create({ model, input: text });
  const tokensUsed = response.usage?.total_tokens ?? 0;

  if (options.supabase) {
    await options.supabase.from("ai_costs").insert({
      agency_id: options.agencyId,
      client_id: options.clientId ?? null,
      model,
      tokens_in: tokensUsed,
      tokens_out: 0,
      estimated_cost_usd: estimateCostUsd(model, tokensUsed, 0),
      pipeline_run_id: options.pipelineRunId ?? null,
    });
  }

  return { embedding: response.data[0].embedding, tokensUsed };
}

export async function structuredCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  model = "gpt-4o",
  options?: Partial<CallAIOptions>
): Promise<{ result: T; tokensUsed: number }> {
  const { result, tokensUsed } = await callAI<T>(
    systemPrompt,
    userPrompt,
    {
      agencyId: options?.agencyId ?? "",
      clientId: options?.clientId,
      pipelineRunId: options?.pipelineRunId,
      supabase: options?.supabase,
      responseFormat: "json",
    },
    model
  );
  return { result, tokensUsed };
}
