import { createClient } from "jsr:@supabase/supabase-js@2";

const BASE = "https://api.stockx.com/v2";

async function getAccessToken(): Promise<string> {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await supabase.from("stockx_auth").select("*").eq("id", 1).single();
  if (error || !data) throw new Error("StockX not connected.");
  if (data.access_token && data.access_token_expires_at && new Date(data.access_token_expires_at).getTime() > Date.now() + 60_000) return data.access_token;
  const res = await fetch("https://accounts.stockx.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: Deno.env.get("STOCKX_CLIENT_ID")!,
      client_secret: Deno.env.get("STOCKX_CLIENT_SECRET")!,
      refresh_token: data.refresh_token,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const tokens = await res.json();
  await supabase.from("stockx_auth").update({
    access_token: tokens.access_token,
    access_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    refresh_token: tokens.refresh_token || data.refresh_token,
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
  return tokens.access_token;
}

export async function stockxFetch(path: string, params?: Record<string, string>): Promise<unknown> {
  const accessToken = await getAccessToken();
  const apiKey = Deno.env.get("STOCKX_API_KEY")!;
  const url = new URL(`${BASE}${path}`);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}`, "x-api-key": apiKey },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`StockX ${res.status}: ${text}`);
  try { return JSON.parse(text); } catch { throw new Error(`Non-JSON: ${text.slice(0, 200)}`); }
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const MEN_TO_WOMEN_DELTA = 1.5;

export function normalizeSize(raw: string): string {
  return raw.trim().replace(",", ".");
}

interface ParsedSize { value: number; suffix: "M" | "W" | null; }

function parseSize(raw: string): ParsedSize | null {
  const t = normalizeSize(raw);
  const m = t.match(/^(\d+(?:\.\d+)?)\s*([MW])?$/i);
  if (!m) return null;
  return { value: parseFloat(m[1]), suffix: m[2] ? (m[2].toUpperCase() as "M" | "W") : null };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }

function variantValueMatches(variantValue: string, wanted: string): boolean {
  const w = parseSize(wanted);
  if (!w) return false;
  const parts = variantValue.split("/").map((p) => parseSize(p)).filter((p): p is ParsedSize => p !== null);
  for (const v of parts) {
    if (v.value === w.value) {
      if (w.suffix === null) return true;
      if (w.suffix === "W" && v.suffix === "W") return true;
      if (w.suffix === "M" && v.suffix !== "W") return true;
    }
    if (w.suffix !== "W" && v.suffix === "W" && round1(v.value - w.value) === MEN_TO_WOMEN_DELTA) return true;
    if (w.suffix === "W" && v.suffix !== "W" && round1(w.value - v.value) === MEN_TO_WOMEN_DELTA) return true;
  }
  return false;
}

/**
 * Is this catalog Women's-exclusive? True iff EVERY variant has a W suffix
 * on EVERY part (after splitting combined notations on '/'). For such
 * products we KNOW a bare-number user input is meant in Men's US convention
 * (because the user can't have entered their Women's size with the matching
 * EU size unless they wear Women's exclusively — the EU 44.5 example proves
 * they're using Men's convention).
 */
function isAllWomensCatalog<T extends { variantValue: string }>(variants: T[]): boolean {
  if (variants.length === 0) return false;
  for (const v of variants) {
    for (const piece of v.variantValue.split("/")) {
      const ps = parseSize(piece);
      if (!ps || ps.suffix !== "W") return false;
    }
  }
  return true;
}

export function findMatchingVariant<T extends { variantValue: string }>(variants: T[], wantedSize: string): T | null {
  const w = parseSize(wantedSize);
  if (!w) return null;
  // Step 1: Women's-exclusive catalog + bare/M input → prefer +1.5 conversion.
  // For Jordan 1 Latte (Women's), user typing "10.5" should match "12W" not
  // "10.5W" — because EU 44.5 corresponds to Women's 12, not Women's 10.5.
  if (isAllWomensCatalog(variants) && w.suffix !== "W") {
    const targetW = round1(w.value + MEN_TO_WOMEN_DELTA);
    for (const v of variants) {
      for (const piece of v.variantValue.split("/")) {
        const ps = parseSize(piece);
        if (ps && ps.suffix === "W" && ps.value === targetW) return v;
      }
    }
  }
  // Step 2: General matcher (direct, suffix-strip, both-direction ±1.5).
  for (const v of variants) {
    if (variantValueMatches(v.variantValue, wantedSize)) return v;
  }
  return null;
}
