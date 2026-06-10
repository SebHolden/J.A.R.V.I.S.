/**
 * Agency Brain smoke test (3 queries)
 * Usage: node scripts/test-brain-smoke.mjs
 */

const QUERIES = [
  { q: "Trova l'ultima vetrofania approvata di Bergamo", expect: /bergamo|v2/i },
  { q: "Quale file ha approvato Laura?", expect: /laura|bergamo|approv/i },
  { q: "Quali materiali abbiamo usato per la campagna prevenzione?", expect: /prevenzione|flyer|cuore/i },
];

async function main() {
  const base = process.env.BASE_URL ?? "http://localhost:3000";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    console.error("Set NEXT_PUBLIC_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "chiara@publitrust.it", password: "demo1234" }),
  });
  const auth = await authRes.json();
  if (!auth.access_token) {
    console.error("Auth failed:", auth);
    process.exit(1);
  }

  const session = {
    access_token: auth.access_token,
    refresh_token: auth.refresh_token,
    expires_in: auth.expires_in,
    expires_at: auth.expires_at,
    token_type: auth.token_type,
    user: auth.user,
  };
  const hostname = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieName = `sb-${hostname}-auth-token`;
  const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
  const cookie = `${cookieName}=${encodeURIComponent(cookieValue)}`;
  let allPass = true;

  console.log("\n=== Agency Brain Smoke Test ===\n");

  for (const { q, expect } of QUERIES) {
    const res = await fetch(`${base}/api/brain/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ query: q }),
    });
    const data = await res.json();

    if (!res.ok) {
      console.log(`FAIL | ${q}`);
      console.log(`       Error: ${data.error}\n`);
      allPass = false;
      continue;
    }

    const hasSources = data.sources?.length > 0;
    const hasReasoning = !!data.selection_reasoning;
    const contentMatch = expect.test(data.answer) || data.sources?.some((s) => expect.test(s.snippet));
    const pass = hasSources && hasReasoning && (contentMatch || data.confidence > 0);

    if (!pass) allPass = false;
    console.log(`${pass ? "PASS" : "FAIL"} | ${q}`);
    console.log(`       confidence=${data.confidence}% sources=${data.sources?.length}`);
    console.log(`       answer: ${data.answer?.slice(0, 120)}...\n`);
  }

  console.log(allPass ? "ALL BRAIN TESTS PASSED" : "SOME BRAIN TESTS FAILED");
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
