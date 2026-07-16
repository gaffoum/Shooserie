import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { CORS, findMatchingVariant, json, stockxFetch } from "./stockx-client.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    const rawSize = url.searchParams.get("size");
    let variantId = url.searchParams.get("variantId");
    if (!productId) return json({ error: "Missing productId" }, 400);
    if (!variantId && !rawSize) return json({ error: "Provide either variantId or size" }, 400);
    let matchedVariantValue: string | null = null;
    if (!variantId) {
      const variants = await stockxFetch(`/catalog/products/${productId}/variants`) as Array<{ variantId: string; variantValue: string }>;
      const match = findMatchingVariant(variants, rawSize!);
      if (!match) {
        return json({
          error: `Size ${rawSize} not found in catalog variants.`,
          availableSizes: variants.map((v) => v.variantValue),
          hint: "If this is a Women's exclusive, the catalog lists 'W' variants. Common Nike/Jordan mapping: Women's = Men's + 1.5 (e.g. Men's 10.5 = Women's 12).",
        }, 404);
      }
      variantId = match.variantId;
      matchedVariantValue = match.variantValue;
    }
    const market = await stockxFetch(`/catalog/products/${productId}/variants/${variantId}/market-data`) as Record<string, unknown>;
    const lowestAsk = parseFloatSafe(market.lowestAskAmount);
    const highestBid = parseFloatSafe(market.highestBidAmount);
    const midPrice = (lowestAsk !== null && highestBid !== null)
      ? Math.round(((lowestAsk + highestBid) / 2) * 100) / 100
      : (lowestAsk ?? highestBid);
    return json({
      productId, variantId, variantValue: matchedVariantValue, size: rawSize,
      currency: (market.currencyCode as string) ?? "USD",
      lowestAsk, highestBid, midPrice,
      fetchedAt: new Date().toISOString(), raw: market,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function parseFloatSafe(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}
