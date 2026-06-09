# ============================================================================
#  fix-stickers-stockx.ps1
#  Corrige l'absence des photos StockX dans le PDF de stickers (cause : CORS).
#  - Cree l'edge function Supabase "image-proxy" (fetch server-side + CORS)
#  - Reecrit src/lib/stickerPdf.ts pour router les URLs externes vers le proxy
#  A lancer depuis la RACINE du repo Shooserie.
# ============================================================================
$ErrorActionPreference = 'Stop'

function Write-FileUtf8NoBom {
  param([string]$Path, [string]$Content)
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $enc)
  Write-Host "  ecrit : $Path" -ForegroundColor DarkGray
}

# --- Garde-fou : racine du repo ---
if (-not (Test-Path 'src/lib/stickerPdf.ts')) {
  Write-Host "ERREUR : lance ce script depuis la racine du repo Shooserie." -ForegroundColor Red
  Write-Host "         (src/lib/stickerPdf.ts introuvable depuis $((Get-Location).Path))" -ForegroundColor Red
  exit 1
}

# ============================================================================
#  1/2 - Edge function image-proxy
# ============================================================================
Write-Host "== 1/2  Edge function image-proxy ==" -ForegroundColor Cyan
$edgeFn = @'
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
'@
Write-FileUtf8NoBom -Path 'supabase/functions/image-proxy/index.ts' -Content $edgeFn

# ============================================================================
#  2/2 - stickerPdf.ts (reecrit avec routage proxy)
# ============================================================================
Write-Host "== 2/2  src/lib/stickerPdf.ts ==" -ForegroundColor Cyan
$sticker = @'
/**
 * Generation PDF de stickers au format Avery L7165 / J8165.
 *   - A4 portrait : 210 x 297 mm
 *   - 8 stickers par page (2 colonnes x 4 lignes)
 *   - Taille sticker : 99 x 67 mm
 *
 * Layout (par sticker) :
 *   - Bande couleur marque (optionnelle) : 3mm de large a gauche
 *   - Photo (optionnelle) : 38 x 38 mm a gauche, sous la bande marque
 *   - Bloc texte : a droite de la photo, occupe le reste
 *   - QR code (optionnel) : 14 x 14 mm en bas a droite
 *   - Footer "shooserie.tech" : tres petit en bas a gauche
 */
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import { brandColor } from './brandColors'

// ====== Dimensions L7165 (mm) ======
export const PAGE_W = 210
export const PAGE_H = 297
export const STICKER_W = 99
export const STICKER_H = 67.7
export const MARGIN_LEFT = 4.5
export const MARGIN_TOP = 12.7
export const GAP_X = 2.5
export const GAP_Y = 0
export const COLS = 2
export const ROWS = 4
export const PER_PAGE = COLS * ROWS // 8

// ====== Layout interne (mm) ======
const PAD_TOP = 3
const PAD_LR = 4
const BRAND_BAR_W = 3
const PHOTO_SIZE = 38
const QR_SIZE = 14
const TEXT_GAP = 4

// ====== Proxy images (contournement CORS des CDN externes) ======
// Les images "stockx_image_url" viennent de CDN tiers qui ne renvoient pas
// d'en-tete Access-Control-Allow-Origin => un fetch direct echoue (slot vide).
// On route ces hotes vers l'edge function image-proxy (fetch server-side).
// Les photos uploadees (Supabase Storage) restent en direct (deja CORS-clean).
const SUPABASE_FUNCTIONS_URL = 'https://eykhnpnmpcrvcpajirst.supabase.co/functions/v1'
const IMAGE_PROXY = `${SUPABASE_FUNCTIONS_URL}/image-proxy`
const PROXY_HOSTS = new Set<string>([
  'images.stockx.com',
  'n.nordstrommedia.com',
  'cdn11.bigcommerce.com',
])

function buildFetchUrl(url: string): string {
  try {
    if (PROXY_HOSTS.has(new URL(url).host)) {
      return `${IMAGE_PROXY}?url=${encodeURIComponent(url)}`
    }
  } catch {
    // url invalide : on tente en direct
  }
  return url
}

export interface StickerSneaker {
  id: string
  name: string
  brand: string | null
  colorway: string | null
  size_eu: string | null
  size_us: string | null
  stockx_image_url: string | null
  photo_url: string | null
}

export interface StickerOptions {
  showPhoto: boolean
  showSize: boolean
  showQR: boolean
  showBrandBar: boolean
  qrBaseUrl: string // ex: "https://shooserie.tech/sneakers"
}

const DEFAULT_OPTIONS: StickerOptions = {
  showPhoto: true,
  showSize: true,
  showQR: true,
  showBrandBar: true,
  qrBaseUrl: 'https://shooserie.tech/sneakers',
}

// ====== Helpers ======
function getStickerPosition(indexInPage: number): { x: number; y: number } {
  const col = indexInPage % COLS
  const row = Math.floor(indexInPage / COLS)
  const x = MARGIN_LEFT + col * (STICKER_W + GAP_X)
  const y = MARGIN_TOP + row * (STICKER_H + GAP_Y)
  return { x, y }
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(buildFetchUrl(url), { mode: 'cors' })
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function generateQrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    margin: 0,
    width: 200,
    color: { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  })
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '')
  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  }
}

/**
 * Dessine un sticker individuel.
 * Layout (gauche -> droite) :
 *   x : bord du sticker
 *   x + 3 : fin bande marque (si activee)
 *   x + 7 : debut photo (si activee, BRAND_BAR_W + PAD_LR)
 *   x + 45 : fin photo (debut + PHOTO_SIZE)
 *   x + 49 : debut texte (fin photo + TEXT_GAP)
 *   x + 95 : fin zone texte (sticker - PAD_LR)
 */
async function drawSticker(
  doc: jsPDF,
  sneaker: StickerSneaker,
  x: number,
  y: number,
  options: StickerOptions,
) {
  // ====== Bande couleur marque (3mm large a gauche, toute la hauteur) ======
  let cursorX = x + PAD_LR // par defaut, le texte demarre apres une marge gauche
  if (options.showBrandBar) {
    const color = brandColor(sneaker.brand)
    const rgb = hexToRgb(color)
    doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(x, y, BRAND_BAR_W, STICKER_H, 'F')
    cursorX = x + BRAND_BAR_W + PAD_LR
  }

  // ====== Photo (38x38mm) ======
  let textX = cursorX
  if (options.showPhoto) {
    const photoUrl = sneaker.stockx_image_url || sneaker.photo_url
    if (photoUrl) {
      const dataUrl = await loadImageAsDataUrl(photoUrl)
      if (dataUrl) {
        try {
          // Detecte JPG vs PNG depuis le data URL
          const format = dataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
          doc.addImage(dataUrl, format, cursorX, y + PAD_TOP, PHOTO_SIZE, PHOTO_SIZE, undefined, 'FAST')
        } catch {
          // ignore erreurs (format invalide, CORS, etc.)
        }
      }
    }
    textX = cursorX + PHOTO_SIZE + TEXT_GAP
  }

  // ====== Bloc texte ======
  const textWidth = STICKER_W - (textX - x) - PAD_LR
  let curY = y + PAD_TOP + 2 // demarrage texte un peu en dessous du haut

  // Marque (brand) - petit, gris, uppercase
  if (sneaker.brand) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    doc.text(sneaker.brand.toUpperCase(), textX, curY + 3)
    curY += 5
  }

  // Nom du modele - bold, max 2 lignes
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(10, 10, 10)
  const nameLines = doc.splitTextToSize(sneaker.name || '(sans nom)', textWidth)
  const displayLines = nameLines.slice(0, 2)
  doc.text(displayLines, textX, curY + 3.5)
  curY += displayLines.length * 4.2 + 2

  // Colorway - small, gris (1 ligne max)
  if (sneaker.colorway) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    const cwLines = doc.splitTextToSize(sneaker.colorway, textWidth).slice(0, 1)
    doc.text(cwLines, textX, curY + 3)
    curY += 4.5
  }

  // Taille - bold
  if (options.showSize) {
    const parts: string[] = []
    if (sneaker.size_eu) parts.push(`EU ${sneaker.size_eu}`)
    if (sneaker.size_us) parts.push(`US ${sneaker.size_us}`)
    if (parts.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(10, 10, 10)
      // Place la taille un peu plus bas pour eviter le QR
      const sizeY = options.showQR
        ? Math.min(curY + 4, y + STICKER_H - QR_SIZE - 3)
        : curY + 4
      doc.text(parts.join(' · '), textX, sizeY)
    }
  }

  // ====== QR code (bas droite, 14x14mm) ======
  if (options.showQR) {
    try {
      const url = `${options.qrBaseUrl}/${sneaker.id}`
      const qrData = await generateQrDataUrl(url)
      doc.addImage(
        qrData,
        'PNG',
        x + STICKER_W - PAD_LR - QR_SIZE,
        y + STICKER_H - PAD_TOP - QR_SIZE,
        QR_SIZE,
        QR_SIZE,
        undefined,
        'FAST',
      )
    } catch {
      // ignore
    }
  }

  // ====== Footer "shooserie.tech" (bas gauche, tres petit) ======
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.setTextColor(156, 163, 175)
  doc.text('shooserie.tech', textX, y + STICKER_H - 2)
}

// ====== API publique ======

export async function generateStickerPdf(
  sneakers: StickerSneaker[],
  options: Partial<StickerOptions> = {},
): Promise<Blob> {
  const opts: StickerOptions = { ...DEFAULT_OPTIONS, ...options }
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  for (let i = 0; i < sneakers.length; i++) {
    const indexInPage = i % PER_PAGE
    if (i > 0 && indexInPage === 0) doc.addPage()
    const { x, y } = getStickerPosition(indexInPage)
    // eslint-disable-next-line no-await-in-loop
    await drawSticker(doc, sneakers[i], x, y, opts)
  }

  return doc.output('blob')
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
'@
Write-FileUtf8NoBom -Path 'src/lib/stickerPdf.ts' -Content $sticker

# --- Unblock ---
Get-ChildItem -Path 'supabase/functions/image-proxy/index.ts','src/lib/stickerPdf.ts' -File -ErrorAction SilentlyContinue | Unblock-File

Write-Host ""
Write-Host "OK - fichiers ecrits." -ForegroundColor Green
Write-Host ""
Write-Host "Etapes suivantes (manuel) :" -ForegroundColor Yellow
Write-Host "  1) git branch                 # attendu : * dev"
Write-Host "  2) supabase functions deploy image-proxy --no-verify-jwt"
Write-Host "  3) git add -A"
Write-Host "     git commit -m ""fix(stickers): proxy images StockX pour PDF (CORS)"""
Write-Host "     git push origin dev"
Write-Host "  4) Test sur le preview dev (navigation privee) :"
Write-Host "     https://shooserie-git-dev-gill-affoums-projects.vercel.app"
