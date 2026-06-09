# ============================================================================
#  fix-stickers-middot.ps1
#  Separateur de taille : remplace le "/" (et l'ancien "A·" bugue) par un VRAI
#  point median dessine (petit cercle plein), identique a l'apercu, sans bug
#  d'encodage et sans embarquer de police.
#  Le reste (ratio image, proxy) est inchange.
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

if (-not (Test-Path 'src/lib/stickerPdf.ts')) {
  Write-Host "ERREUR : lance ce script depuis la racine du repo Shooserie." -ForegroundColor Red
  exit 1
}

Write-Host "== Reecriture de src/lib/stickerPdf.ts ==" -ForegroundColor Cyan
$sticker = @'
/**
 * Generation PDF de stickers au format Avery L7165 / J8165.
 *   - A4 portrait : 210 x 297 mm
 *   - 8 stickers par page (2 colonnes x 4 lignes)
 *   - Taille sticker : 99 x 67 mm
 *
 * Layout (par sticker) :
 *   - Bande couleur marque (optionnelle) : 3mm de large a gauche
 *   - Photo (optionnelle) : inscrite dans 38 x 38 mm, RATIO PRESERVE (centree)
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

// Dimensions naturelles d'une image (depuis un data URL deja charge => instantane).
function getImageDims(dataUrl: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
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
 */
async function drawSticker(
  doc: jsPDF,
  sneaker: StickerSneaker,
  x: number,
  y: number,
  options: StickerOptions,
) {
  // ====== Bande couleur marque (3mm large a gauche, toute la hauteur) ======
  let cursorX = x + PAD_LR
  if (options.showBrandBar) {
    const color = brandColor(sneaker.brand)
    const rgb = hexToRgb(color)
    doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(x, y, BRAND_BAR_W, STICKER_H, 'F')
    cursorX = x + BRAND_BAR_W + PAD_LR
  }

  // ====== Photo (inscrite dans 38x38mm, ratio preserve, centree) ======
  let textX = cursorX
  if (options.showPhoto) {
    const photoUrl = sneaker.stockx_image_url || sneaker.photo_url
    if (photoUrl) {
      const dataUrl = await loadImageAsDataUrl(photoUrl)
      if (dataUrl) {
        try {
          const format = dataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG'
          const dims = await getImageDims(dataUrl)
          let dw = PHOTO_SIZE
          let dh = PHOTO_SIZE
          if (dims && dims.w > 0 && dims.h > 0) {
            const ratio = dims.w / dims.h
            if (ratio >= 1) {
              dh = PHOTO_SIZE / ratio
            } else {
              dw = PHOTO_SIZE * ratio
            }
          }
          const dx = cursorX + (PHOTO_SIZE - dw) / 2
          const dy = y + PAD_TOP + (PHOTO_SIZE - dh) / 2
          doc.addImage(dataUrl, format, dx, dy, dw, dh, undefined, 'FAST')
        } catch {
          // ignore
        }
      }
    }
    textX = cursorX + PHOTO_SIZE + TEXT_GAP
  }

  // ====== Bloc texte ======
  const textWidth = STICKER_W - (textX - x) - PAD_LR
  let curY = y + PAD_TOP + 2

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

  // Taille - bold. Separateur = VRAI point median DESSINE (cercle plein) pour
  // eviter le bug d'encodage jsPDF sur "·" tout en gardant le look de l'apercu.
  // Virgule -> point pour homogeneiser l'affichage (44,5 et 44.5 selon les paires).
  if (options.showSize) {
    const eu = sneaker.size_eu ? `EU ${sneaker.size_eu.replace(',', '.')}` : ''
    const us = sneaker.size_us ? `US ${sneaker.size_us.replace(',', '.')}` : ''
    const parts = [eu, us].filter(Boolean)
    if (parts.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(10, 10, 10)
      const sizeY = options.showQR
        ? Math.min(curY + 4, y + STICKER_H - QR_SIZE - 3)
        : curY + 4

      if (parts.length === 2) {
        const gap = 1.5 // mm de part et d'autre du point
        const w0 = doc.getTextWidth(parts[0])
        doc.text(parts[0], textX, sizeY)
        const dotX = textX + w0 + gap
        doc.setFillColor(10, 10, 10)
        // remonte le point a mi-hauteur du texte (baseline - ~1mm)
        doc.circle(dotX, sizeY - 1, 0.4, 'F')
        doc.text(parts[1], dotX + gap, sizeY)
      } else {
        doc.text(parts[0], textX, sizeY)
      }
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

Get-ChildItem -Path 'src/lib/stickerPdf.ts' -File | Unblock-File

Write-Host ""
Write-Host "OK - stickerPdf.ts reecrit (point median dessine)." -ForegroundColor Green
Write-Host ""
Write-Host "Etapes :" -ForegroundColor Yellow
Write-Host "  git branch                 # * dev"
Write-Host "  git add -A"
Write-Host "  git commit -m ""fix(stickers): vrai point median dessine entre EU et US"""
Write-Host "  git push origin dev"
Write-Host "  -> attendre Vercel READY, puis test navigation privee."
