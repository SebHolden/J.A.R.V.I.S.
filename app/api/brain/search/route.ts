import { NextResponse } from "next/server";
import "@/lib/brain/init";
import { backfillKnowledgeChunks } from "@/lib/brain/backfill";
import { generateBrainAnswer } from "@/lib/brain/search";
import { isEnabled } from "@/lib/flags/feature-flags";
import { getCurrentUser } from "@/lib/db/queries";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const backfilledAgencies = new Set<string>();

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const enabled = await isEnabled(supabase, user.agency_id, "agency_brain");
    if (!enabled) {
      return NextResponse.json({ error: "Agency Brain is not enabled" }, { status: 403 });
    }

    const { query, client_id: clientId } = await request.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();

    if (!backfilledAgencies.has(user.agency_id)) {
      await backfillKnowledgeChunks(serviceClient, user.agency_id);
      backfilledAgencies.add(user.agency_id);
    }

    if (clientId) {
      const { data: client } = await serviceClient
        .from("clients")
        .select("id, name")
        .eq("id", clientId)
        .eq("agency_id", user.agency_id)
        .maybeSingle();
      if (!client) {
        return NextResponse.json({ error: "Invalid client_id" }, { status: 403 });
      }
    }

    let clientScopeLabel: string | "all" = "all";
    if (clientId) {
      const { data: client } = await serviceClient
        .from("clients")
        .select("name")
        .eq("id", clientId)
        .single();
      clientScopeLabel = client?.name ?? "all";
    }

    const answer = await generateBrainAnswer(
      serviceClient,
      user.agency_id,
      query.trim(),
      clientId ?? null,
      clientScopeLabel
    );

    return NextResponse.json(answer);
  } catch (err) {
    console.error("Brain search error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
