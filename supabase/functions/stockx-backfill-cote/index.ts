// ============================================================
// stockx-backfill-cote — rattrapage admin des cotes manquantes.
//
// Contexte : ~206 paires ont un lien catalogue StockX mais market_price NULL
// (créées avant le fix « cote à la création »). Sans cote, le trigger DB
// trg_sneaker_rarity les classe 'unknown'. Cette fonction remplit market_price
// par LOTS ; le trigger recalcule alors la rareté (aucune logique ici).
//
// MÉCANIQUE IDENTIQUE au remplissage à la création (même endpoint market-data,
// même conversion USD→EUR, même écriture) → si (2) est validé en prod, (3) l'est.
//
// Sécurité : verify_jwt=true (plateforme) + garde admin (email == ADMIN_EMAIL).
// Écriture en base via service_role (les 206 paires appartiennent à 25 users →
// la RLS empêcherait un batch côté client).
//
// Appel : POST JSON. dryRun par défaut TRUE (aucun appel StockX, aucune écriture).
//   { "dryRun": true,  "segment": "all|variant|size", "limit": 50 }  → compte + échantillon
//   { "dryRun": false, "segment": "variant",          "limit": 50 }  → traite un lot
//
// Traitement par paire :
//   - variant présent → market-data(variantId)                      [1 appel]
//   - sinon (taille)  → /variants (résout+stocke le variant) + market-data [2 appels]
//   Pause entre appels (delayMs, défaut 300) pour ménager le quota StockX.
// ============================================================
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { CORS, findMatchingVariant, json, stockxFetch } from "./stockx-client.ts";

const ADMIN_EMAIL = "gaffoum@gmail.com";
const USD_TO_EUR_RATE = 0.92; // aligné sur src/lib/stockx.ts
const MAX_LIMIT = 100;        // borne par invocation (durée d'exécution edge)
const DEFAULT_LIMIT = 50;
const DEFAULT_DELAY_MS = 300;

type Segment = "all" | "variant" | "size";

interface Row {
  id: string;
  stockx_product_id: string;
  stockx_variant_id: string | null;
  size_us: string | null;
  price_history: unknown;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function emailFromJwt(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(b64));
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

function parseFloatSafe(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // --- Garde admin ---
  const email = emailFromJwt(req.headers.get("Authorization"));
  if (email !== ADMIN_EMAIL) return json({ error: "Forbidden" }, 403);

  // --- Paramètres ---
  let body: { dryRun?: boolean; segment?: Segment; limit?: number; delayMs?: number };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const dryRun = body.dryRun !== false; // défaut TRUE : opt-in explicite pour écrire
  const segment: Segment = body.segment === "variant" || body.segment === "size" ? body.segment : "all";
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(body.limit ?? DEFAULT_LIMIT)));
  const delayMs = Math.max(0, Math.floor(body.delayMs ?? DEFAULT_DELAY_MS));

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // --- Sélection du lot (ordre déterministe = reproductible entre lots) ---
  let q = supabase
    .from("sneakers")
    .select("id, stockx_product_id, stockx_variant_id, size_us, price_history")
    .or("market_price.is.null,market_price.lte.0")
    .not("stockx_product_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (segment === "variant") {
    q = q.not("stockx_variant_id", "is", null);
  } else if (segment === "size") {
    q = q.is("stockx_variant_id", null).not("size_us", "is", null);
  } else {
    // 'all' : variant OU (pas de variant mais une taille)
    q = q.or("stockx_variant_id.not.is.null,size_us.not.is.null");
  }

  const { data, error } = await q;
  if (error) return json({ error: `select failed: ${error.message}` }, 500);

  // On écarte les tailles vides restantes (filtre length côté JS).
  const rows = (data as Row[]).filter(
    (r) => r.stockx_variant_id || (r.size_us && r.size_us.trim().length > 0),
  );

  // --- DRY-RUN : aucun appel StockX, aucune écriture ---
  if (dryRun) {
    const withVariant = rows.filter((r) => r.stockx_variant_id).length;
    const withSize = rows.length - withVariant;
    return json({
      dryRun: true,
      segment,
      limit,
      selected: rows.length,
      breakdown: { variant: withVariant, size: withSize },
      estimatedStockxCalls: withVariant * 1 + withSize * 2,
      sampleIds: rows.slice(0, 10).map((r) => r.id),
    });
  }

  // --- EXÉCUTION : traite le lot, non-bloquant paire par paire ---
  const results: Array<Record<string, unknown>> = [];
  let updated = 0, skipped = 0, failed = 0, calls = 0;

  for (const r of rows) {
    try {
      let variantId = r.stockx_variant_id;

      if (!variantId) {
        // Résout la variante depuis la taille (1 appel) puis market-data.
        if (delayMs) await sleep(delayMs);
        calls++;
        const variants = await stockxFetch(
          `/catalog/products/${r.stockx_product_id}/variants`,
        ) as Array<{ variantId: string; variantValue: string }>;
        const match = findMatchingVariant(variants, r.size_us!.trim());
        if (!match) {
          skipped++;
          results.push({ id: r.id, status: "skipped", reason: "size_not_in_catalog" });
          continue;
        }
        variantId = match.variantId;
      }

      if (delayMs) await sleep(delayMs);
      calls++;
      const market = await stockxFetch(
        `/catalog/products/${r.stockx_product_id}/variants/${variantId}/market-data`,
      ) as Record<string, unknown>;

      const lowestAsk = parseFloatSafe(market.lowestAskAmount);
      const highestBid = parseFloatSafe(market.highestBidAmount);
      const mid = (lowestAsk !== null && highestBid !== null)
        ? Math.round(((lowestAsk + highestBid) / 2) * 100) / 100
        : (lowestAsk ?? highestBid);

      if (mid === null || mid === undefined) {
        skipped++;
        results.push({ id: r.id, status: "skipped", reason: "no_market_data" });
        continue;
      }

      const usd = mid;
      const eur = Math.round(usd * USD_TO_EUR_RATE);
      const fetchedAt = new Date().toISOString();
      const history = Array.isArray(r.price_history) ? r.price_history : [];

      const { error: upErr } = await supabase
        .from("sneakers")
        .update({
          market_price: eur,
          market_price_usd: usd,
          stockx_variant_id: variantId,
          last_price_check: fetchedAt,
          price_history: [...history, { date: fetchedAt, price: eur, source: "stockx" }],
        })
        .eq("id", r.id);

      if (upErr) {
        failed++;
        results.push({ id: r.id, status: "error", reason: upErr.message });
        continue;
      }

      updated++;
      results.push({ id: r.id, status: "updated", eur, usd, variantId });
    } catch (e) {
      failed++;
      results.push({ id: r.id, status: "error", reason: e instanceof Error ? e.message : String(e) });
    }
  }

  return json({
    dryRun: false,
    segment,
    limit,
    processed: rows.length,
    updated,
    skipped,
    failed,
    stockxCalls: calls,
    results,
  });
});
