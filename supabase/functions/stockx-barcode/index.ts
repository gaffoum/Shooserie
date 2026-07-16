// stockx-barcode: resolve a barcode (UPC/EAN) to a StockX product + variant.
// Strategy:
//   1. Search StockX catalog with the barcode as free-text query (their search
//      does match GTINs in practice).
//   2. For each candidate product (top 5), fetch its variants and look for
//      a variant whose `gtins[]` contains the scanned code. Try both the raw
//      code and a leading-zero-stripped form (UPC <-> EAN-13 normalization).
//   3. If matched: return full product info + matched variantId + size +
//      image URL. The front-end can pre-fill name/brand/colorway/SKU/sizes/
//      stockx_product_id/stockx_variant_id/stockx_image_url in one shot.
//   4. If no match: return { found: false } so the front-end can fall back
//      to UPCitemdb.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { CORS, json, stockxFetch } from "./stockx-client.ts";

type Variant = {
  variantId: string;
  variantName?: string;
  variantValue?: string;
  sizeChart?: {
    availableConversions?: Array<{ size?: string; type?: string }>;
  };
  gtins?: Array<{ identifier: string; type: string }>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code")?.trim();
    if (!code) return json({ found: false, error: "Missing code" }, 400);

    // Normalize: barcodes can be EAN-13 (with a leading 0 for UPC) or UPC-A.
    const variants = new Set<string>([code]);
    if (code.startsWith("0")) variants.add(code.replace(/^0+/, ""));
    if (code.length === 12) variants.add(`0${code}`); // UPC -> EAN-13

    // 1. Search by the code.
    const search = await stockxFetch("/catalog/search", {
      query: code,
      pageNumber: "1",
      pageSize: "5",
    }) as { products?: Array<Record<string, unknown>> };

    const candidates = search.products ?? [];

    // 2. Find which candidate has a variant matching our barcode.
    for (const p of candidates) {
      const productId = p.productId as string;
      if (!productId) continue;

      let productVariants: Variant[];
      try {
        productVariants = await stockxFetch(
          `/catalog/products/${productId}/variants`,
        ) as Variant[];
      } catch {
        continue;
      }

      const match = productVariants.find((v) =>
        v.gtins?.some((g) => variants.has(g.identifier))
      );
      if (!match) continue;

      // 3. Build response.
      const slug = String(match.variantName ?? "").split(":")[0];
      const imageUrl = slug
        ? `https://images.stockx.com/360/${slug}/Images/${slug}/Lv2/img01.jpg`
        : null;

      const attrs = (p.productAttributes ?? {}) as Record<string, unknown>;
      const conversions = match.sizeChart?.availableConversions ?? [];
      const sizeUS = conversions.find((c) => c.type === "us m")?.size ?? match.variantValue ?? null;
      const sizeEU = conversions.find((c) => c.type === "eu")?.size ?? null;

      return json({
        found: true,
        source: "stockx",
        code,
        product: {
          productId,
          variantId: match.variantId,
          sizeUS: stripPrefix(sizeUS, "US M "),
          sizeEU: stripPrefix(sizeEU, "EU "),
          title: p.title,
          brand: p.brand,
          styleId: p.styleId,
          urlKey: p.urlKey,
          colorway: attrs.colorway,
          releaseDate: attrs.releaseDate,
          retailPrice: attrs.retailPrice,
          imageUrl,
          stockxUrl: p.urlKey ? `https://stockx.com/${p.urlKey}` : null,
        },
      });
    }

    return json({ found: false, source: null, code });
  } catch (e) {
    return json({
      found: false,
      error: e instanceof Error ? e.message : String(e),
    }, 500);
  }
});

function stripPrefix(s: string | null | undefined, prefix: string): string | null {
  if (!s) return null;
  return s.startsWith(prefix) ? s.slice(prefix.length) : s;
}
