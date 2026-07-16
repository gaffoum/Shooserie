// Shared StockX API client.
import { createClient } from "jsr:@supabase/supabase-js@2";

const BASE = "https://api.stockx.com/v2";

async function getAccessToken(): Promise<string> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase
    .from("stockx_auth")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) throw new Error("StockX not connected.");

  if (
    data.access_token &&
    data.access_token_expires_at &&
    new Date(data.access_token_expires_at).getTime() > Date.now() + 60_000
  ) {
    return data.access_token;
  }

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
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await supabase
    .from("stockx_auth")
    .update({
      access_token: tokens.access_token,
      access_token_expires_at: expiresAt,
      refresh_token: tokens.refresh_token || data.refresh_token,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  return tokens.access_token;
}

export async function stockxFetch(
  path: string,
  params?: Record<string, string>,
): Promise<unknown> {
  const accessToken = await getAccessToken();
  const apiKey = Deno.env.get("STOCKX_API_KEY")!;

  const url = new URL(`${BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": apiKey,
    },
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`StockX ${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON: ${text.slice(0, 200)}`);
  }
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
