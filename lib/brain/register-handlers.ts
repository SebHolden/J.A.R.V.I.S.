import type { SupabaseClient } from "@supabase/supabase-js";
import { onEvent } from "@/lib/events/event-bus";
import { chunkApprovalSummary, chunkMaterialVersion } from "./chunking";

let registered = false;

export function registerBrainHandlers(getSupabase: () => Promise<SupabaseClient>): void {
  if (registered) return;
  registered = true;

  onEvent("material.uploaded", async (event) => {
    const supabase = await getSupabase();
    const versionId = event.payload.material_version_id as string;
    if (versionId) {
      await chunkMaterialVersion(supabase, event.agency_id, versionId);
    }
  });

  onEvent("inbox.approved", async (event) => {
    const supabase = await getSupabase();
    const inboxItemId = event.payload.inbox_item_id as string;
    const clientId = (event.payload.client_id as string) ?? null;
    const summary = event.payload.summary as string;
    if (inboxItemId && summary) {
      await chunkApprovalSummary(supabase, event.agency_id, inboxItemId, clientId, summary);
    }
  });
}
