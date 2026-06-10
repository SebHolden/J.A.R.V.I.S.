import type { SupabaseClient } from "@supabase/supabase-js";
import { callAI, createEmbedding } from "@/lib/ai/openai";
import type { BrainAnswer, BrainSource } from "@/lib/types/pipeline";

interface ChunkMatch {
  id: string;
  content: string;
  source_type: string;
  source_id: string | null;
  client_id: string | null;
  similarity: number;
}

function sourceLink(sourceType: string, sourceId: string | null): string {
  if (!sourceId) return "/materials";
  if (sourceType === "material_version" || sourceType === "material") {
    return `/materials?highlight=${sourceId}`;
  }
  if (sourceType === "brief") return `/briefs`;
  if (sourceType === "approval") return `/approval-inbox`;
  return "/materials";
}

function mapToBrainSource(chunk: ChunkMatch, label?: string): BrainSource {
  const sourceType =
    chunk.source_type === "material_version"
      ? "material"
      : (chunk.source_type as BrainSource["source_type"]);

  return {
    chunk_id: chunk.id,
    source_type: sourceType,
    source_id: chunk.source_id ?? chunk.id,
    source_label: label ?? chunk.content.slice(0, 80),
    link: sourceLink(chunk.source_type, chunk.source_id),
    relevance_score: chunk.similarity,
    snippet: chunk.content.slice(0, 240),
  };
}

async function resolveLabel(
  supabase: SupabaseClient,
  chunk: ChunkMatch
): Promise<string> {
  if (chunk.source_type === "material_version" && chunk.source_id) {
    const { data: version } = await supabase
      .from("material_versions")
      .select("version_number, material_id")
      .eq("id", chunk.source_id)
      .single();
    if (version) {
      const { data: material } = await supabase
        .from("materials")
        .select("title")
        .eq("id", version.material_id)
        .single();
      if (material) return `${material.title} v${version.version_number}`;
    }
  }
  return chunk.content.slice(0, 80);
}

export async function searchKnowledgeChunks(
  supabase: SupabaseClient,
  agencyId: string,
  query: string,
  clientId?: string | null
): Promise<ChunkMatch[]> {
  const { embedding } = await createEmbedding(query, {
    agencyId,
    clientId,
    supabase,
  });

  const { data, error } = await supabase.rpc("match_knowledge_chunks", {
    query_embedding: embedding,
    match_agency_id: agencyId,
    match_client_id: clientId ?? null,
    match_count: 8,
  });

  if (error) throw new Error(`Vector search failed: ${error.message}`);
  return (data ?? []) as ChunkMatch[];
}

export async function generateBrainAnswer(
  supabase: SupabaseClient,
  agencyId: string,
  query: string,
  clientId: string | null | undefined,
  clientScopeLabel: string | "all"
): Promise<BrainAnswer> {
  const matches = await searchKnowledgeChunks(supabase, agencyId, query, clientId);
  const top = matches[0];
  const threshold = 0.75;

  if (!top || top.similarity < threshold) {
    return {
      answer:
        "Non ho trovato materiali sufficientemente rilevanti. Prova a riformulare la ricerca o verifica che il materiale sia stato caricato.",
      confidence: 0,
      sources: [],
      selection_reasoning: "Nessun chunk ha superato la soglia di similarità 0.75.",
      alternatives_considered: matches.slice(0, 3).map((m) => mapToBrainSource(m)),
      client_scope: clientScopeLabel,
    };
  }

  const primary = matches.slice(0, 5);
  const alternatives = matches.slice(5, 8);

  const labeledSources: BrainSource[] = [];
  for (const chunk of primary) {
    const label = await resolveLabel(supabase, chunk);
    labeledSources.push(mapToBrainSource(chunk, label));
  }

  const labeledAlternatives: BrainSource[] = [];
  for (const chunk of alternatives) {
    const label = await resolveLabel(supabase, chunk);
    labeledAlternatives.push(mapToBrainSource(chunk, label));
  }

  const contextBlock = primary
    .map((c, i) => `[${i + 1}] (${c.similarity.toFixed(2)}) ${c.content}`)
    .join("\n");

  const systemPrompt = `Sei Agency Brain, motore di ricerca conversazionale per un'agenzia di marketing italiana.
Rispondi SOLO in base alle fonti fornite. Se non sei sicuro, dillo.
Rispondi in JSON:
- answer: risposta naturale in italiano
- confidence: 0-100
- selection_reasoning: perché hai scelto queste fonti
Non inventare file o approvazioni non presenti nelle fonti.`;

  const userPrompt = `DOMANDA: ${query}

FONTI:
${contextBlock}`;

  const { result } = await callAI<{
    answer: string;
    confidence: number;
    selection_reasoning: string;
  }>(
    systemPrompt,
    userPrompt,
    {
      agencyId,
      clientId,
      supabase,
      responseFormat: "json",
    }
  );

  return {
    answer: result.answer,
    confidence: Math.min(100, Math.max(0, result.confidence ?? Math.round(top.similarity * 100))),
    sources: labeledSources,
    selection_reasoning: result.selection_reasoning,
    alternatives_considered: labeledAlternatives,
    client_scope: clientScopeLabel,
  };
}

export async function searchForMemoryContext(
  supabase: SupabaseClient,
  agencyId: string,
  clientId: string,
  query: string
): Promise<ChunkMatch[]> {
  try {
    return await searchKnowledgeChunks(supabase, agencyId, query, clientId);
  } catch {
    return [];
  }
}
