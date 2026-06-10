import type { SupabaseClient } from "@supabase/supabase-js";

const cache = new Map<string, { enabled: boolean; expiresAt: number }>();
const CACHE_TTL_MS = 30_000;

function cacheKey(agencyId: string, key: string): string {
  return `${agencyId}:${key}`;
}

export async function isEnabled(
  supabase: SupabaseClient,
  agencyId: string,
  key: string
): Promise<boolean> {
  const ck = cacheKey(agencyId, key);
  const cached = cache.get(ck);
  if (cached && cached.expiresAt > Date.now()) return cached.enabled;

  const { data } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("agency_id", agencyId)
    .eq("key", key)
    .maybeSingle();

  const enabled = data?.enabled ?? false;
  cache.set(ck, { enabled, expiresAt: Date.now() + CACHE_TTL_MS });
  return enabled;
}

export function clearFeatureFlagCache(): void {
  cache.clear();
}
