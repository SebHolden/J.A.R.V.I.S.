import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApprovalInboxItem, Client, Material, MaterialVersion, User } from "@/lib/types/database";

export async function getCurrentUser(supabase: SupabaseClient): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function getClients(supabase: SupabaseClient, agencyId: string): Promise<Client[]> {
  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("agency_id", agencyId)
    .order("name");
  return data ?? [];
}

export async function getClientById(supabase: SupabaseClient, clientId: string) {
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("client_id", clientId);

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId);

  return { client, contacts: contacts ?? [], projects: projects ?? [] };
}

export async function getApprovalInboxItems(
  supabase: SupabaseClient,
  agencyId: string,
  status?: string
): Promise<ApprovalInboxItem[]> {
  let query = supabase
    .from("approval_inbox_items")
    .select("*, clients(name), projects(title)")
    .eq("agency_id", agencyId)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data } = await query;
  return (data ?? []) as ApprovalInboxItem[];
}

export async function getMaterialsWithVersions(supabase: SupabaseClient, agencyId: string) {
  const { data: materials } = await supabase
    .from("materials")
    .select("*, clients(name), projects(title)")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (!materials?.length) return [];

  const materialIds = materials.map((m: Material) => m.id);
  const { data: versions } = await supabase
    .from("material_versions")
    .select("*")
    .in("material_id", materialIds)
    .order("version_number", { ascending: false });

  return materials.map((m: Material & { clients?: { name: string }; projects?: { title: string } }) => ({
    ...m,
    versions: (versions ?? []).filter((v: MaterialVersion) => v.material_id === m.id),
  }));
}

export async function getCommandCenterStats(supabase: SupabaseClient, agencyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: pendingApprovals } = await supabase
    .from("approval_inbox_items")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .eq("status", "pending");

  const { count: risksToday } = await supabase
    .from("approval_inbox_items")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .in("quality_result", ["warning", "block"])
    .eq("status", "pending");

  const { count: handledToday } = await supabase
    .from("approval_inbox_items")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .gte("resolved_at", today.toISOString());

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: learningRecords } = await supabase
    .from("learning_records")
    .select("outcome")
    .eq("agency_id", agencyId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const records = learningRecords ?? [];
  const approved = records.filter((r) => r.outcome === "approved").length;
  const total = records.length;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 87;

  return {
    pendingApprovals: pendingApprovals ?? 0,
    risks: risksToday ?? 0,
    handledToday: handledToday ?? 0,
    approvalRate,
    blockedProjects: 0,
  };
}
