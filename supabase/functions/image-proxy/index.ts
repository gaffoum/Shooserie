// supabase/functions/image-proxy/index.ts
//
// Proxy d'images pour la generation PDF de stickers.
// Contourne le CORS des CDN externes (StockX, Nordstrom, BigCommerce) en
// fetchant l'image cote serveur (aucune restriction CORS server-side) puis en
// la renvoyant avec les en-tetes Access-Control-Allow-Origin.
//
// Deploiement : supabase functions deploy image-proxy --no-verify-jwt
// (proxy public, securise par une allowlist stricte d'hotes => pas de SSRF).

const ALLOWED_HOSTS = new Set<string>([
  'images.stockx.com',
  'n.nordstrommedia.com',
  'cdn11.bigcommerce.com',
])

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  const target = new URL(req.url).searchParams.get('url')
  if (!target) {
    return new Response('Missing "url" param', { status: 400, headers: CORS_HEADERS })
  }

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return new Response('Invalid url', { status: 400, headers: CORS_HEADERS })
  }

  // Anti-SSRF : on n'accepte que du HTTPS sur des hotes explicitement autorises.
  if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.host)) {
    return new Response('Host not allowed', { status: 403, headers: CORS_HEADERS })
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        // Certains CDN bloquent les fetch sans User-Agent "navigateur".
        'User-Agent': 'Mozilla/5.0 (compatible; ShooserieBot/1.0)',
        'Accept': 'image/jpeg,image/png,image/*;q=0.8',
      },
    })

    if (!upstream.ok) {
      return new Response(`Upstream ${upstream.status}`, { status: 502, headers: CORS_HEADERS })
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
    if (!contentType.startsWith('image/')) {
      return new Response('Not an image', { status: 415, headers: CORS_HEADERS })
    }

    const body = await upstream.arrayBuffer()
    return new Response(body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    })
  } catch (e) {
    return new Response(`Proxy error: ${e}`, { status: 500, headers: CORS_HEADERS })
  }
})