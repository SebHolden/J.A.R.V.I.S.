/**
 * Direct pipeline test (no HTTP auth) — Legnano → Bergamo
 * Usage: npx tsx scripts/test-legnano-direct.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { runPipeline } from "../lib/agents/orchestrator";

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const TEST_REQUEST = `Buongiorno,

vorremmo adattare la vetrofania della sede di Legnano per Bergamo.

Pensiamo di mantenere la grafica già approvata ma aggiornando i riferimenti della sede.

Vi chiediamo anche di verificare se il logo è ancora quello corretto — ci sembra di ricordare che c'era stato un aggiornamento.

Grazie`;

const SYNLAB_CLIENT_ID = "c0000000-0000-4000-8000-000000000001";
const BERGANO_V2_ID = "g0000000-0000-4000-8000-000000000002";
const AGENCY_ID = "a0000000-0000-4000-8000-000000000001";
const CHIARA_ID = "b0000000-0000-4000-8000-000000000001";

async function main() {
  loadEnv();

  if (!process.env.OPENAI_API_KEY?.trim()) {
    process.env.AGENCYPILOT_TEST_MODE = "legnano";
    console.log("(no OPENAI_API_KEY — using deterministic test fixtures)\n");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const start = Date.now();
  const { context: ctx, inboxItemId } = await runPipeline(
    supabase,
    AGENCY_ID,
    CHIARA_ID,
    TEST_REQUEST
  );
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const checks = [
    {
      name: "Cliente SYNLAB",
      pass: ctx.client_id === SYNLAB_CLIENT_ID,
      detail: `client_id=${ctx.client_id}`,
    },
    {
      name: "Memory v2 approvata (non solo draft)",
      pass: ctx.memory_package.approved_materials.some((m) =>
        m.title.toLowerCase().includes("bergamo")
      ),
      detail: JSON.stringify(ctx.memory_package.approved_materials.map((m) => m.title)),
    },
    {
      name: "Logo warning",
      pass: ctx.memory_package.warnings.some((w) => w.toLowerCase().includes("logo")),
      detail: JSON.stringify(ctx.memory_package.warnings),
    },
    {
      name: "Learning tone adjustments",
      pass: ctx.recommended_tone_adjustments.length > 0,
      detail: JSON.stringify(ctx.recommended_tone_adjustments),
    },
    {
      name: "Quality pass or warning (not block)",
      pass: ctx.quality_result === "pass" || ctx.quality_result === "warning",
      detail: ctx.quality_result,
    },
    {
      name: "Brief Legnano/Bergamo",
      pass:
        JSON.stringify(ctx.brief_draft).toLowerCase().includes("legnano") &&
        JSON.stringify(ctx.brief_draft).toLowerCase().includes("bergamo"),
      detail: ctx.brief_draft.objective,
    },
    {
      name: "Sources material_version_id",
      pass: ctx.sources.some(
        (s) => s.id === BERGANO_V2_ID || s.type === "material_version"
      ),
      detail: JSON.stringify(ctx.sources),
    },
    {
      name: "Pipeline < 30s",
      pass: parseFloat(elapsed) < 30,
      detail: `${elapsed}s`,
    },
  ];

  console.log("\n=== Legnano → Bergamo Test Results (direct) ===\n");
  console.log(`inbox_item_id: ${inboxItemId}\n`);

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
