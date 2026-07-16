// stockx-search: free-text catalog search. Returns normalized products.
// Note: StockX search results don't include images. Use stockx-product to get one.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { CORS, json, stockxFetch } from "./stockx-client.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim();
    if (!q || q.length < 2) return json({ products: [] });

    const pageSize = url.searchParams.get("pageSize") ?? "10";
    const data = await stockxFetch("/catalog/search", {
      query: q,
      pageNumber: "1",
      pageSize,
    }) as { products?: Array<Record<string, unknown>> };

    const products = (data.products ?? []).map((p) => {
      const attrs = (p.productAttributes ?? {}) as Record<string, unknown>;
      return {
        productId: p.productId,
        urlKey: p.urlKey,
        title: p.title,
        brand: p.brand,
        productType: p.productType,
        styleId: p.styleId, // SKU, at root level
        colorway: attrs.colorway,
        color: attrs.color,
        gender: attrs.gender,
        releaseDate: attrs.releaseDate,
        retailPrice: attrs.retailPrice,
      };
    });

    return json({ products });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
