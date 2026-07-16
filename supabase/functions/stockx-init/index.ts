// Public endpoint: constructs the StockX OAuth authorize URL using our CLIENT_ID secret
// and redirects the browser to it. No sensitive op — client_id is a public identifier.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(() => {
  const clientId = Deno.env.get("STOCKX_CLIENT_ID");
  if (!clientId) {
    return new Response("STOCKX_CLIENT_ID secret missing", { status: 500 });
  }

  const state = crypto.randomUUID();
  const url = new URL("https://accounts.stockx.com/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", "https://stockx.com/");
  url.searchParams.set("scope", "offline_access openid");
  url.searchParams.set("audience", "gateway.stockx.com");
  url.searchParams.set("state", state);

  return Response.redirect(url.toString(), 302);
});
