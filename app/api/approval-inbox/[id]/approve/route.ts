import { NextResponse } from "next/server";
import "@/lib/brain/init";
import { emitEvent } from "@/lib/events/event-bus";
import { getCurrentUser } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: item, error: fetchError } = await supabase
    .from("approval_inbox_items")
    .select("*")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .single();

  if (fetchError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  if (item.status !== "pending") {
    return NextResponse.json({ error: "Item already resolved" }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("approval_inbox_items")
    .update({
      status: "approved",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (item.client_id && item.project_id) {
    await supabase.from("briefs").insert({
      project_id: item.project_id,
      client_id: item.client_id,
      content: item.brief_json,
      status: "approved",
      created_by_ai: true,
    });
  }

  const tasks = (item.suggested_tasks as { title: string; priority: string; due_date: string | null; reasoning: string }[]) ?? [];
  for (const task of tasks) {
    if (item.project_id) {
      await supabase.from("tasks").insert({
        project_id: item.project_id,
        title: task.title,
        owner_id: user.id,
        status: "pending",
        priority: task.priority,
        due_date: task.due_date,
        source_request_id: item.request_id,
        ai_reasoning: task.reasoning,
      });
    }
  }

  await supabase.from("learning_records").insert({
    agency_id: user.agency_id,
    client_id: item.client_id,
    event_type: "reply_approved",
    input_snapshot: { inbox_item_id: id, type: item.type },
    output_snapshot: { reply: item.reply_draft },
    outcome: "approved",
  });

  await supabase.from("audit_logs").insert({
    agency_id: user.agency_id,
    user_id: user.id,
    action: "approval_approved",
    entity_type: "approval_inbox_item",
    entity_id: id,
    metadata: { tasks_created: tasks.length },
  });

  await emitEvent(supabase, {
    type: "inbox.approved",
    agency_id: user.agency_id,
    payload: {
      inbox_item_id: id,
      client_id: item.client_id,
      summary: `Approvato: ${item.title}. ${item.summary ?? ""}`,
    },
    source: "approval.approve",
  });

  return NextResponse.json({ success: true });
}
