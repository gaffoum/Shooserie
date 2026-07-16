// Public endpoint: receives the OAuth `code` from the user (returned by StockX after they
// authorize), exchanges it server-side for refresh_token + access_token, and stores them
// in the stockx_auth table (single row id=1). Service-role client used to bypass RLS.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response(
      "Missing ?code=... in URL. Did you copy the code from the StockX redirect?",
      { status: 400 },
    );
  }

  const clientId = Deno.env.get("STOCKX_CLIENT_ID");
  const clientSecret = Deno.env.get("STOCKX_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return new Response("STOCKX_CLIENT_ID or STOCKX_CLIENT_SECRET secret missing", {
      status: 500,
    });
  }

  // Exchange the authorization code for tokens.
  const tokenRes = await fetch("https://accounts.stockx.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: "https://stockx.com/",
    }),
  });

  const tokenText = await tokenRes.text();
  if (!tokenRes.ok) {
    return new Response(
      `StockX token exchange failed (${tokenRes.status}): ${tokenText}`,
      { status: 400 },
    );
  }

  let tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  try {
    tokens = JSON.parse(tokenText);
  } catch {
    return new Response(`Could not parse StockX response: ${tokenText}`, {
      status: 500,
    });
  }

  if (!tokens.refresh_token) {
    return new Response(
      "No refresh_token returned. The 'offline_access' scope may be missing.",
      { status: 500 },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error } = await supabase.from("stockx_auth").upsert({
    id: 1,
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    access_token_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return new Response(`DB write failed: ${error.message}`, { status: 500 });
  }

  return new Response(
    "✅ StockX connecté ! Tu peux fermer cet onglet et revenir au chat.",
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
});
