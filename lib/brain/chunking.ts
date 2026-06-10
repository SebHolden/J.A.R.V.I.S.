import type { SupabaseClient } from "@supabase/supabase-js";
import { createEmbedding } from "@/lib/ai/openai";

export async function upsertKnowledgeChunk(
  supabase: SupabaseClient,
  params: {
    agencyId: string;
    clientId: string | null;
    sourceType: string;
    sourceId: string;
    content: string;
    pipelineRunId?: string | null;
  }
): Promise<void> {
  const { embedding } = await createEmbedding(params.content, {
    agencyId: params.agencyId,
    clientId: params.clientId,
    pipelineRunId: params.pipelineRunId,
    supabase,
  });

  const { data: existing } = await supabase
    .from("knowledge_chunks")
    .select("id")
    .eq("agency_id", params.agencyId)
    .eq("source_type", params.sourceType)
    .eq("source_id", params.sourceId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("knowledge_chunks")
      .update({ content: params.content, embedding })
      .eq("id", existing.id);
  } else {
    await supabase.from("knowledge_chunks").insert({
      agency_id: params.agencyId,
      client_id: params.clientId,
      source_type: params.sourceType,
      source_id: params.sourceId,
      content: params.content,
      embedding,
    });
  }
}

export async function chunkMaterialVersion(
  supabase: SupabaseClient,
  agencyId: string,
  materialVersionId: string
): Promise<void> {
  const { data: version } = await supabase
    .from("material_versions")
    .select("id, version_number, status, notes, file_path, material_id")
    .eq("id", materialVersionId)
    .single();

  if (!version) return;

  const { data: material } = await supabase
    .from("materials")
    .select("id, title, file_type, client_id, agency_id")
    .eq("id", version.material_id)
    .single();

  if (!material || material.agency_id !== agencyId) return;

  const content = [
    `${material.title} v${version.version_number}`,
    `Tipo: ${material.file_type}`,
    `Stato: ${version.status}`,
    version.notes ? `Note: ${version.notes}` : "",
    version.file_path ? `File: ${version.file_path}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  await upsertKnowledgeChunk(supabase, {
    agencyId,
    clientId: material.client_id,
    sourceType: "material_version",
    sourceId: version.id,
    content,
  });
}

export async function chunkApprovalSummary(
  supabase: SupabaseClient,
  agencyId: string,
  inboxItemId: string,
  clientId: string | null,
  summary: string
): Promise<void> {
  await upsertKnowledgeChunk(supabase, {
    agencyId,
    clientId,
    sourceType: "approval",
    sourceId: inboxItemId,
    content: summary,
  });
}
