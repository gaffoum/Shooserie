// stockx-product: fetch full product detail + variants + image URL.
// Image URL pattern (confirmed): https://images.stockx.com/360/{slug}/Images/{slug}/Lv2/img01.jpg
// where {slug} is the prefix of variantName before the colon.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { CORS, json, stockxFetch } from "./stockx-client.ts";

type Variant = {
  variantId: string;
  variantName?: string;
  variantValue?: string;
  sizeChart?: {
    defaultConversion?: { size?: string; type?: string };
    availableConversions?: Array<{ size?: string; type?: string }>;
  };
  gtins?: Array<{ identifier: string; type: string }>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");
    if (!productId) return json({ error: "Missing productId" }, 400);

    const [productResp, variantsResp] = await Promise.all([
      stockxFetch(`/catalog/products/${productId}`),
      stockxFetch(`/catalog/products/${productId}/variants`),
    ]);

    const product = productResp as {
      productId: string;
      brand?: string;
      productType?: string;
      styleId?: string;
      urlKey?: string;
      title?: string;
      productAttributes?: Record<string, unknown>;
    };
    const variants = (variantsResp as Variant[]) ?? [];

    // Derive image slug from variantName prefix.
    let imageUrl: string | null = null;
    const firstVariantName = variants[0]?.variantName;
    if (firstVariantName) {
      const slug = String(firstVariantName).split(":")[0];
      imageUrl =
        `https://images.stockx.com/360/${slug}/Images/${slug}/Lv2/img01.jpg`;
    }

    const simpleVariants = variants.map((v) => ({
      variantId: v.variantId,
      size: v.variantValue,
      sizes: v.sizeChart?.availableConversions ?? [],
      gtins: (v.gtins ?? []).map((g) => g.identifier),
    }));

    const attrs = (product.productAttributes ?? {}) as Record<string, unknown>;

    return json({
      productId: product.productId,
      title: product.title,
      brand: product.brand,
      styleId: product.styleId,
      urlKey: product.urlKey,
      colorway: attrs.colorway,
      color: attrs.color,
      gender: attrs.gender,
      releaseDate: attrs.releaseDate,
      retailPrice: attrs.retailPrice,
      imageUrl,
      stockxUrl: product.urlKey ? `https://stockx.com/${product.urlKey}` : null,
      variants: simpleVariants,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
