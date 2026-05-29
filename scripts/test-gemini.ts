/**
 * Diagnóstico da integração Gemini.
 * Execução: npx tsx scripts/test-gemini.ts
 *
 * Testa sistematicamente modelos e versões de API para identificar
 * qual combinação está disponível no ambiente atual.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

// ── Carrega .env.local manualmente (Next.js não está rodando aqui) ──────────
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.warn("[AVISO] .env.local não encontrado");
    return;
  }
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = val;
  }
  console.log("[OK] .env.local carregado");
}

loadEnvLocal();

// ── Validação da chave ───────────────────────────────────────────────────────
const apiKey = process.env.GEMINI_API_KEY;
console.log("\n══ Diagnóstico GEMINI ══════════════════════════════════");
console.log("GEMINI_API_KEY presente :", !!apiKey);
console.log("Tamanho da chave        :", apiKey?.length ?? 0);
console.log("Prefixo esperado (AIza) :", apiKey?.startsWith("AIza") ? "✅ correto" : "❌ incorreto — chaves do Google AI Studio começam com AIza");
console.log("════════════════════════════════════════════════════════\n");

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY não encontrada. Adicione ao .env.local:");
  console.error("   GEMINI_API_KEY=AIza...");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// ── Cenários de teste ────────────────────────────────────────────────────────
const TESTS = [
  { model: "gemini-1.5-flash",     apiVersion: "v1beta" as const },
  { model: "gemini-1.5-flash",     apiVersion: "v1"     as const },
  { model: "gemini-1.5-flash-001", apiVersion: "v1"     as const },
  { model: "gemini-3.1-flash-lite",     apiVersion: "v1beta" as const },
  { model: "gemini-3.1-flash-lite",     apiVersion: "v1"     as const },
];

async function runTest(modelName: string, apiVersion: "v1" | "v1beta") {
  const label = `${modelName} [${apiVersion}]`;
  try {
    const model = genAI.getGenerativeModel(
      { model: modelName },
      { apiVersion }
    );
    const result = await model.generateContent("Say: OK");
    const text = result.response.text().trim();
    console.log(`✅ SUCESSO  ${label}`);
    console.log(`   Resposta: "${text.slice(0, 60)}"`);
    return { ok: true, model: modelName, apiVersion, text };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.match(/\[(\d{3})/)?.[1] ?? "???";
    console.log(`❌ FALHOU   ${label} → HTTP ${status}: ${msg.slice(0, 100)}`);
    return { ok: false, model: modelName, apiVersion, error: msg };
  }
}

(async () => {
  console.log("Testando combinações de modelo/endpoint...\n");

  const results = [];
  for (const { model, apiVersion } of TESTS) {
    const r = await runTest(model, apiVersion);
    results.push(r);
  }

  const working = results.filter(r => r.ok);
  console.log("\n══ Resultado ═══════════════════════════════════════════");
  if (working.length === 0) {
    console.error("❌ Nenhuma combinação funcionou.");
    console.error("\nPossíveis causas:");
    console.error("  1. Chave GEMINI_API_KEY inválida ou expirada");
    console.error("  2. Generative Language API não habilitada no projeto Google Cloud");
    console.error("  3. Cota excedida na conta");
    console.error("\nComo verificar:");
    console.error("  → https://aistudio.google.com/app/apikey");
    console.error("  → https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com");
  } else {
    console.log(`✅ ${working.length} combinação(ões) funcionando:`);
    working.forEach(r => console.log(`   → model: "${r.model}", apiVersion: "${r.apiVersion}"`));
    console.log(`\nUse no client.ts: model: "${working[0].model}", apiVersion: "${working[0].apiVersion}"`);
  }
  console.log("════════════════════════════════════════════════════════\n");
})();
