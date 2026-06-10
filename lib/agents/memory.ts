import type { SupabaseClient } from "@supabase/supabase-js";
import { searchForMemoryContext } from "@/lib/brain/search";
import type { PipelineContext, MaterialVersionRef, DecisionRef, ProjectRef } from "@/lib/types/pipeline";

export async function runMemoryAgent(
  supabase: SupabaseClient,
  ctx: PipelineContext
): Promise<PipelineContext> {
  if (!ctx.client_id) {
    return {
      ...ctx,
      memory_package: {
        ...ctx.memory_package,
        warnings: ["Client not identified — memory retrieval skipped"],
      },
    };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("brand_guidelines")
    .eq("id", ctx.client_id)
    .eq("agency_id", ctx.agency_id)
    .single();

  if (!client) {
    return {
      ...ctx,
      client_id: null,
      memory_package: {
        ...ctx.memory_package,
        warnings: ["Client ID non valido per questa agenzia — memoria non caricata"],
      },
    };
  }

  const { data: contact } = ctx.contact_id
    ? await supabase
        .from("contacts")
        .select("preferences, notes, name")
        .eq("id", ctx.contact_id)
        .eq("client_id", ctx.client_id)
        .single()
    : { data: null };

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, status, deadline")
    .eq("client_id", ctx.client_id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: materials } = await supabase
    .from("materials")
    .select("id, title, file_type")
    .eq("client_id", ctx.client_id);

  const materialIds = (materials ?? []).map((m) => m.id);
  const { data: versions } = materialIds.length
    ? await supabase
        .from("material_versions")
        .select("*")
        .in("material_id", materialIds)
        .order("version_number", { ascending: false })
    : { data: [] };

  const approvedMaterials: MaterialVersionRef[] = [];
  const warnings: string[] = [];
  const seenMaterials = new Set<string>();

  for (const v of versions ?? []) {
    const material = materials?.find((m) => m.id === v.material_id);
    if (!material) continue;

    if (v.status === "approved" && !seenMaterials.has(v.material_id)) {
      seenMaterials.add(v.material_id);
      approvedMaterials.push({
        id: v.id,
        material_id: v.material_id,
        title: material.title,
        version_number: v.version_number,
        status: v.status,
        file_path: v.file_path,
        notes: v.notes,
      });
    }

    if (v.status === "draft" && ctx.referenced_material_ids.includes(v.material_id)) {
      warnings.push(
        `${material.title} v${v.version_number} è in bozza — usare solo versioni approvate (v2 approvata disponibile)`
      );
    }
  }

  const approvedVersionIds = (versions ?? [])
    .filter((v) => v.status === "approved")
    .map((v) => v.id);

  const { data: approvals } = approvedVersionIds.length
    ? await supabase
        .from("approvals")
        .select("*")
        .in("material_version_id", approvedVersionIds)
        .order("approved_at", { ascending: false })
        .limit(10)
    : { data: [] };

  const pastDecisions: DecisionRef[] = (approvals ?? []).map((a: {
    id: string;
    approved_by: string;
    notes: string;
    approved_at: string;
    material_version_id: string;
  }) => {
    const version = versions?.find((v) => v.id === a.material_version_id);
    const material = materials?.find((m) => m.id === version?.material_id);
    return {
      id: a.id,
      type: "material_approval",
      description: `${material?.title ?? "Material"} approvato da ${a.approved_by}: ${a.notes}`,
      date: a.approved_at,
    };
  });

  const recentProjects: ProjectRef[] = (projects ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    deadline: p.deadline,
  }));

  const logoMentioned = /\blogo\b/i.test(ctx.raw_input);
  if (logoMentioned) {
    const guidelines = (client.brand_guidelines as Record<string, unknown>) ?? {};
    const logoGuideline = typeof guidelines.logo === "string" ? guidelines.logo : null;
    warnings.push(
      logoGuideline
        ? `Verifica logo richiesta dal cliente — versione di riferimento nelle linee guida: "${logoGuideline}". Confermare con il cliente se è ancora aggiornata.`
        : "Verifica logo richiesta dal cliente — confermare versione corretta prima della produzione."
    );
  }

  const bergamoApproved = approvedMaterials.find((m) =>
    m.title.toLowerCase().includes("bergamo")
  );
  const legnanoApproved = approvedMaterials.find((m) =>
    m.title.toLowerCase().includes("legnano")
  );
  if (bergamoApproved && ctx.raw_input.toLowerCase().includes("bergamo")) {
    const draftBergamo = (versions ?? []).find(
      (v) =>
        v.material_id === bergamoApproved.material_id &&
        v.status === "draft" &&
        v.version_number > bergamoApproved.version_number
    );
    if (draftBergamo) {
      warnings.push(
        `Vetrofania Bergamo v${draftBergamo.version_number} è in bozza — usare solo v${bergamoApproved.version_number} approvata`
      );
    }
  }
  if (legnanoApproved && ctx.raw_input.toLowerCase().includes("legnano")) {
    warnings.push(
      `Vetrofania Legnano v${legnanoApproved.version_number} disponibile come riferimento per l'adattamento`
    );
  }

  const vectorMatches = await searchForMemoryContext(
    supabase,
    ctx.agency_id,
    ctx.client_id,
    `${ctx.intent} ${ctx.raw_input}`.slice(0, 500)
  );

  for (const match of vectorMatches.slice(0, 3)) {
    if (match.similarity < 0.7) continue;
    if (match.source_type === "material_version" && match.source_id) {
      const already = approvedMaterials.some((m) => m.id === match.source_id);
      if (!already) {
        const version = (versions ?? []).find((v) => v.id === match.source_id);
        const material = materials?.find((m) => m.id === version?.material_id);
        if (version?.status === "approved" && material) {
          approvedMaterials.push({
            id: version.id,
            material_id: version.material_id,
            title: material.title,
            version_number: version.version_number,
            status: version.status,
            file_path: version.file_path,
            notes: version.notes,
          });
        }
      }
    }
  }

  const sources = approvedMaterials.map((m) => ({
    type: "material_version" as const,
    id: m.id,
    label: `${m.title} v${m.version_number} (${m.status})`,
  }));

  return {
    ...ctx,
    memory_package: {
      brand_guidelines: (client?.brand_guidelines as Record<string, unknown>) ?? {},
      approved_materials: approvedMaterials,
      past_decisions: pastDecisions,
      contact_preferences: {
        ...(contact?.preferences as Record<string, unknown>),
        contact_name: contact?.name,
        notes: contact?.notes,
      },
      recent_projects: recentProjects,
      warnings,
    },
    sources: [...ctx.sources, ...sources],
  };
}
