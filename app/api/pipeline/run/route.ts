import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/db/queries";
import { runPipeline } from "@/lib/agents/orchestrator";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { raw_input } = await request.json();
    if (!raw_input?.trim()) {
      return NextResponse.json({ error: "raw_input is required" }, { status: 400 });
    }

    const serviceClient = await createServiceClient();
    const { context, inboxItemId } = await runPipeline(
      serviceClient,
      user.agency_id,
      user.id,
      raw_input.trim()
    );

    return NextResponse.json({
      request_id: context.request_id,
      inbox_item_id: inboxItemId,
      confidence: Math.round(
        (context.intake_confidence * 0.3 + context.account_confidence * 0.7)
      ),
      quality_result: context.quality_result,
    });
  } catch (err) {
    console.error("Pipeline error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}
