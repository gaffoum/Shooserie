// Edge Function: barcode-lookup
// Proxy vers UPCitemdb (free trial, 100 req/jour, pas de clé requise).
// Normalise la réponse pour notre app et filtre les images HTTP non utilisables.

interface LookupSuggestion {
  name: string
  brand: string | null
  colorway: string | null
  model: string | null
  size: string | null
  imageUrl: string | null
  category: string | null
  description: string | null
}

interface LookupResponse {
  found: boolean
  source: 'upcitemdb' | null
  code: string
  suggestion: LookupSuggestion | null
  rawCount: number
  error?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const code = (body.code ?? '').trim()
  if (!code) {
    return jsonResponse({ error: 'Field "code" is required' }, 400)
  }

  // On accepte UPC-A (12), EAN-13 (13), EAN-8 (8). On filtre les codes
  // qui ont des lettres (probablement SKUs internes, pas des UPCs).
  if (!/^\d{6,14}$/.test(code)) {
    return jsonResponse({
      found: false,
      source: null,
      code,
      suggestion: null,
      rawCount: 0,
      error: 'Not a numeric barcode (UPC/EAN expected)',
    } satisfies LookupResponse)
  }

  try {
    const result = await lookupUpcItemDb(code)
    return jsonResponse(result)
  } catch (err) {
    return jsonResponse(
      {
        found: false,
        source: null,
        code,
        suggestion: null,
        rawCount: 0,
        error: (err as Error).message,
      } satisfies LookupResponse,
      200, // 200 même en cas d'échec, l'app saura gérer
    )
  }
})

async function lookupUpcItemDb(code: string): Promise<LookupResponse> {
  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(code)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Shooserie/1.0 (collection app)',
    },
  })

  if (!res.ok) {
    return {
      found: false,
      source: null,
      code,
      suggestion: null,
      rawCount: 0,
      error: `UPCitemdb HTTP ${res.status}`,
    }
  }

  const data = await res.json() as {
    code?: string
    total?: number
    items?: Array<{
      title?: string
      brand?: string
      color?: string
      model?: string
      size?: string
      category?: string
      description?: string
      images?: string[]
    }>
  }

  if (data.code !== 'OK' || !data.items || data.items.length === 0) {
    return {
      found: false,
      source: 'upcitemdb',
      code,
      suggestion: null,
      rawCount: 0,
    }
  }

  // On prend le premier item. Souvent c'est le plus pertinent.
  const item = data.items[0]

  // Filtre les images : seules HTTPS (sinon mixed-content bloqué sur Vercel)
  const httpsImages = (item.images ?? []).filter((u) => /^https:\/\//.test(u))
  const imageUrl = httpsImages[0] ?? null

  const suggestion: LookupSuggestion = {
    name: item.title?.trim() || '',
    brand: normalizeBrand(item.brand) ?? null,
    colorway: item.color?.trim() || null,
    model: item.model?.trim() || null,
    size: item.size?.trim() || null,
    imageUrl,
    category: item.category?.trim() || null,
    description: item.description?.trim() || null,
  }

  return {
    found: !!suggestion.name,
    source: 'upcitemdb',
    code,
    suggestion: suggestion.name ? suggestion : null,
    rawCount: data.total ?? data.items.length,
  }
}

/**
 * Aligne les noms de marques sur ceux du formulaire SneakerForm.
 */
function normalizeBrand(raw: string | undefined): string | null {
  if (!raw) return null
  const b = raw.trim().toLowerCase()
  if (!b) return null
  if (b.includes('nike') && b.includes('jordan')) return 'Air Jordan'
  if (b === 'jordan' || b.includes('air jordan')) return 'Air Jordan'
  if (b === 'nike' || b.startsWith('nike ')) return 'Nike'
  if (b.includes('adidas')) return b.includes('yeezy') ? 'Yeezy' : 'Adidas'
  if (b.includes('yeezy')) return 'Yeezy'
  if (b.includes('new balance')) return 'New Balance'
  if (b === 'puma' || b.startsWith('puma ')) return 'Puma'
  if (b.includes('asics')) return 'ASICS'
  // Sinon on capitalize le brut
  return raw
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
