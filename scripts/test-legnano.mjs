/**
 * Real-world test: Legnano → Bergamo
 * Usage: node scripts/test-legnano.mjs
 * Requires: dev server on :3000, supabase running, OPENAI_API_KEY in .env.local
 */

const TEST_EMAIL = "chiara@publitrust.it";
const TEST_PASSWORD = "demo1234";
const TEST_REQUEST = `Buongiorno,

vorremmo adattare la vetrofania della sede di Legnano per Bergamo.

Pensiamo di mantenere la grafica già approvata ma aggiornando i riferimenti della sede.

Vi chiediamo anche di verificare se il logo è ancora quello corretto — ci sembra di ricordare che c'era stato un aggiornamento.

Grazie`;

const SYNLAB_CLIENT_ID = "c0000000-0000-4000-8000-000000000001";
const BERGANO_V2_ID = "g0000000-0000-4000-8000-000000000002";

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
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
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

  const start = Date.now();
  const pipelineRes = await fetch(`${base}/api/pipeline/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ raw_input: TEST_REQUEST }),
  });
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const pipeline = await pipelineRes.json();

  if (!pipelineRes.ok) {
    console.error("Pipeline failed:", pipeline);
    process.exit(1);
  }

  const inboxRes = await fetch(`${base}/api/approval-inbox/${pipeline.inbox_item_id}`, {
    headers: { Cookie: cookie },
  }).catch(() => null);

  let item = null;
  if (inboxRes?.ok) item = await inboxRes.json();

  const ctxRes = await fetch(
    `${supabaseUrl}/rest/v1/approval_inbox_items?id=eq.${pipeline.inbox_item_id}&select=*`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${auth.access_token}` } }
  );
  const items = await ctxRes.json();
  const inboxItem = items[0];
  const ctx = inboxItem?.pipeline_context ?? {};

  const checks = [
    {
      name: "Cliente SYNLAB",
      pass: ctx.client_id === SYNLAB_CLIENT_ID,
      detail: `client_id=${ctx.client_id}`,
    },
    {
      name: "Memory v2 approvata (non solo draft)",
      pass: (ctx.memory_package?.approved_materials ?? []).some((m) =>
        m.title?.toLowerCase().includes("bergamo")
      ),
      detail: JSON.stringify(ctx.memory_package?.approved_materials?.map((m) => m.title)),
    },
    {
      name: "Logo warning",
      pass: (ctx.memory_package?.warnings ?? []).some((w) => w.toLowerCase().includes("logo")),
      detail: JSON.stringify(ctx.memory_package?.warnings),
    },
    {
      name: "Learning tone adjustments",
      pass: (ctx.recommended_tone_adjustments ?? []).length > 0,
      detail: JSON.stringify(ctx.recommended_tone_adjustments),
    },
    {
      name: "Quality pass or warning (not block)",
      pass: pipeline.quality_result === "pass" || pipeline.quality_result === "warning",
      detail: pipeline.quality_result,
    },
    {
      name: "Brief Legnano/Bergamo",
      pass:
        JSON.stringify(ctx.brief_draft ?? {}).toLowerCase().includes("legnano") &&
        JSON.stringify(ctx.brief_draft ?? {}).toLowerCase().includes("bergamo"),
      detail: ctx.brief_draft?.objective,
    },
    {
      name: "Sources material_version_id",
      pass: (ctx.sources ?? []).some((s) => s.id === BERGANO_V2_ID || s.type === "material_version"),
      detail: JSON.stringify(ctx.sources),
    },
    {
      name: "Pipeline < 30s",
      pass: parseFloat(elapsed) < 30,
      detail: `${elapsed}s`,
    },
  ];

  console.log("\n=== Legnano → Bergamo Test Results ===\n");
  let allPass = true;
  for (const c of checks) {
    const status = c.pass ? "PASS" : "FAIL";
    if (!c.pass) allPass = false;
    console.log(`${status} | ${c.name}`);
    console.log(`       ${c.detail}\n`);
  }

  console.log(allPass ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED");
  process.exit(allPass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
