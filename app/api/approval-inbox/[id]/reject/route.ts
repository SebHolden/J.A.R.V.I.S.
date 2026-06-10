import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/db/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reason } = await request.json();

  const { data: item, error: fetchError } = await supabase
    .from("approval_inbox_items")
    .select("*")
    .eq("id", id)
    .eq("agency_id", user.agency_id)
    .single();

  if (fetchError || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("approval_inbox_items")
    .update({
      status: "rejected",
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("learning_records").insert({
    agency_id: user.agency_id,
    client_id: item.client_id,
    event_type: "reply_rejected",
    input_snapshot: { inbox_item_id: id, reply: item.reply_draft },
    output_snapshot: { reason },
    outcome: "rejected",
  });

  await supabase.from("audit_logs").insert({
    agency_id: user.agency_id,
    user_id: user.id,
    action: "approval_rejected",
    entity_type: "approval_inbox_item",
    entity_id: id,
    metadata: { reason },
  });

  return NextResponse.json({ success: true });
}
