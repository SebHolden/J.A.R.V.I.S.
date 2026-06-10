import type { SupabaseClient } from "@supabase/supabase-js";
import { chunkMaterialVersion, upsertKnowledgeChunk } from "./chunking";

export async function backfillKnowledgeChunks(
  supabase: SupabaseClient,
  agencyId: string
): Promise<number> {
  let count = 0;

  const { data: versions } = await supabase
    .from("material_versions")
    .select("id, material_id")
    .limit(200);

  for (const version of versions ?? []) {
    const { data: material } = await supabase
      .from("materials")
      .select("agency_id")
      .eq("id", version.material_id)
      .single();
    if (material?.agency_id !== agencyId) continue;
    await chunkMaterialVersion(supabase, agencyId, version.id);
    count++;
  }

  const { data: approvals } = await supabase
    .from("approvals")
    .select("id, approved_by, notes, approved_at, material_version_id");

  for (const approval of approvals ?? []) {
    const { data: version } = await supabase
      .from("material_versions")
      .select("material_id")
      .eq("id", approval.material_version_id)
      .single();
    if (!version) continue;

    const { data: material } = await supabase
      .from("materials")
      .select("title, client_id, agency_id")
      .eq("id", version.material_id)
      .single();

    if (!material || material.agency_id !== agencyId) continue;

    const content = `${material.title} approvato da ${approval.approved_by} il ${approval.approved_at}. ${approval.notes ?? ""}`;
    await upsertKnowledgeChunk(supabase, {
      agencyId,
      clientId: material.client_id,
      sourceType: "approval",
      sourceId: approval.id,
      content,
    });
    count++;
  }

  return count;
}

