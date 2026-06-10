import type { SupabaseClient } from "@supabase/supabase-js";

export type AgencyPilotEventType =
  | "material.uploaded"
  | "material.approved"
  | "inbox.approved"
  | "brief.created";

export interface AgencyPilotEvent {
  type: AgencyPilotEventType;
  agency_id: string;
  payload: Record<string, unknown>;
  source?: string;
}

type EventHandler = (event: AgencyPilotEvent) => Promise<void> | void;

const handlers = new Map<AgencyPilotEventType | "*", Set<EventHandler>>();

export function onEvent(
  type: AgencyPilotEventType | "*",
  handler: EventHandler
): () => void {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type)!.add(handler);
  return () => handlers.get(type)?.delete(handler);
}

export async function emitEvent(
  supabase: SupabaseClient,
  event: AgencyPilotEvent
): Promise<void> {
  const { data: row, error } = await supabase
    .from("events")
    .insert({
      agency_id: event.agency_id,
      type: event.type,
      payload: event.payload,
      source: event.source ?? "system",
      processed: false,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to persist event: ${error.message}`);

  const specific = handlers.get(event.type) ?? new Set();
  const wildcard = handlers.get("*") ?? new Set();
  for (const handler of [...specific, ...wildcard]) {
    await handler(event);
  }

  await supabase.from("events").update({ processed: true }).eq("id", row.id);
}
