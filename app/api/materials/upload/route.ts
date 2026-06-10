import { NextResponse } from "next/server";
import "@/lib/brain/init";
import { emitEvent } from "@/lib/events/event-bus";
import { getCurrentUser } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const clientId = formData.get("client_id") as string;
  const projectId = formData.get("project_id") as string | null;
  const title = formData.get("title") as string;
  const fileType = formData.get("file_type") as string;

  if (!file || !clientId || !title || !fileType) {
    return NextResponse.json(
      { error: "file, client_id, title, and file_type are required" },
      { status: 400 }
    );
  }

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("agency_id", user.agency_id)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "Invalid client_id for this agency" }, { status: 403 });
  }

  if (projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("client_id", clientId)
      .maybeSingle();
    if (!project) {
      return NextResponse.json({ error: "Invalid project_id for this client" }, { status: 403 });
    }
  }

  const storagePath = `${user.agency_id}/${clientId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("materials")
    .upload(storagePath, file);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: existing } = await supabase
    .from("materials")
    .select("id")
    .eq("client_id", clientId)
    .eq("title", title)
    .maybeSingle();

  let materialId = existing?.id;

  if (!materialId) {
    const { data: material, error: matError } = await supabase
      .from("materials")
      .insert({
        agency_id: user.agency_id,
        client_id: clientId,
        project_id: projectId || null,
        title,
        file_type: fileType,
        storage_path: storagePath,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (matError) {
      return NextResponse.json({ error: matError.message }, { status: 500 });
    }
    materialId = material.id;
  }

  const { data: versions } = await supabase
    .from("material_versions")
    .select("version_number")
    .eq("material_id", materialId)
    .order("version_number", { ascending: false })
    .limit(1);

  const nextVersion = (versions?.[0]?.version_number ?? 0) + 1;

  const { data: version, error: verError } = await supabase
    .from("material_versions")
    .insert({
      material_id: materialId,
      version_number: nextVersion,
      file_path: storagePath,
      status: "draft",
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (verError) {
    return NextResponse.json({ error: verError.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    agency_id: user.agency_id,
    user_id: user.id,
    action: "material_uploaded",
    entity_type: "material_version",
    entity_id: version.id,
    metadata: { title, file_type: fileType, version: nextVersion },
  });

  await emitEvent(supabase, {
    type: "material.uploaded",
    agency_id: user.agency_id,
    payload: {
      material_version_id: version.id,
      material_id: materialId,
      client_id: clientId,
    },
    source: "materials.upload",
  });

  return NextResponse.json({ material_id: materialId, version });
}
