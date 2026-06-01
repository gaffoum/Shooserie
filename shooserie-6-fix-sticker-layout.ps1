# ============================================================
#  Shooserie - Fix layout stickers : photo plus grande + flexbox
#  - Overwrite src/components/StickerPreview.tsx (flexbox)
#  - Overwrite src/lib/stickerPdf.ts (photo 38mm)
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $Path), $Content, (New-Object System.Text.UTF8Encoding $false))
}

Write-Host ""
Write-Host "=== Fix layout stickers : photo 38mm + flexbox ===" -ForegroundColor Cyan

# Backups
foreach ($f in @("src/components/StickerPreview.tsx", "src/lib/stickerPdf.ts")) {
    if (Test-Path $f) {
        Copy-Item $f "$f.bak" -Force
        Write-Host "  Backup -> $f.bak" -ForegroundColor DarkGray
    }
}

# ============================================================
# 1. StickerPreview.tsx (flexbox, photo 38mm)
# ============================================================
$stickerPreviewTsx = @'
/**
 * StickerPreview — apercu d'un sticker au format Avery L7165 (99x67mm).
 * Layout flexbox : bande marque | photo 38mm | bloc texte (flex 1) | QR bas-droite
 *
 * Garanti que le texte reste a droite de la photo (vs absolute positioning qui
 * pouvait deborder/overlap selon le navigateur).
 */
import type { CSSProperties } from 'react'
import { brandColor } from '@/lib/brandColors'
import type { StickerSneaker, StickerOptions } from '@/lib/stickerPdf'

interface StickerPreviewProps {
  sneaker: StickerSneaker
  options: StickerOptions
  /** Echelle de rendu (1 = taille reelle ~96dpi, 2 = double). */
  scale?: number
}

export function StickerPreview({ sneaker, options, scale = 2 }: StickerPreviewProps) {
  // 1mm ≈ 3.78px a 96dpi
  const PX_PER_MM = 3.78 * scale
  const W = 99 * PX_PER_MM
  const H = 67 * PX_PER_MM
  const PHOTO = 38 * PX_PER_MM
  const QR = 14 * PX_PER_MM
  const PAD = 3 * PX_PER_MM
  const PAD_LR = 4 * PX_PER_MM

  const photoUrl = sneaker.stockx_image_url || sneaker.photo_url
  const sizeText: string[] = []
  if (sneaker.size_eu) sizeText.push(`EU ${sneaker.size_eu}`)
  if (sneaker.size_us) sizeText.push(`US ${sneaker.size_us}`)

  const wrap: CSSProperties = {
    width: W,
    height: H,
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    fontFamily: "'Outfit', sans-serif",
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'row',
    boxSizing: 'border-box',
  }

  const brandBarStyle: CSSProperties = {
    width: 3 * PX_PER_MM,
    flexShrink: 0,
    background: brandColor(sneaker.brand),
  }

  const contentStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'row',
    padding: `${PAD}px ${PAD_LR}px`,
    gap: 4 * PX_PER_MM,
    position: 'relative',
    boxSizing: 'border-box',
  }

  const photoBoxStyle: CSSProperties = {
    width: PHOTO,
    height: PHOTO,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  const photoImgStyle: CSSProperties = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    display: 'block',
  }

  const textBoxStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingTop: 1 * PX_PER_MM,
    // Reserve d'espace en bas pour le QR (eviter le chevauchement)
    paddingBottom: options.showQR ? QR + 2 * PX_PER_MM : 4 * PX_PER_MM,
    overflow: 'hidden',
  }

  const brandStyle: CSSProperties = {
    fontSize: 7 * scale,
    color: '#6B7280',
    letterSpacing: '0.06em',
    fontWeight: 600,
    textTransform: 'uppercase',
    lineHeight: 1.2,
  }

  const nameStyle: CSSProperties = {
    fontSize: 10.5 * scale,
    fontWeight: 700,
    color: '#0A0A0A',
    marginTop: 1 * PX_PER_MM,
    lineHeight: 1.18,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    wordBreak: 'break-word',
  }

  const colorwayStyle: CSSProperties = {
    fontSize: 7.5 * scale,
    color: '#6B7280',
    marginTop: 1 * PX_PER_MM,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    lineHeight: 1.2,
  }

  const sizeStyle: CSSProperties = {
    fontSize: 9 * scale,
    fontWeight: 700,
    color: '#0A0A0A',
    marginTop: 'auto',
    paddingTop: 2 * PX_PER_MM,
    lineHeight: 1.2,
  }

  const qrStyle: CSSProperties = {
    position: 'absolute',
    bottom: PAD,
    right: PAD_LR,
    width: QR,
    height: QR,
    background: '#0A0A0A',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 6 * scale,
    fontWeight: 600,
    borderRadius: 2,
  }

  const footerStyle: CSSProperties = {
    position: 'absolute',
    bottom: 1.5 * PX_PER_MM,
    left: PAD_LR,
    fontSize: 5.5 * scale,
    color: '#9CA3AF',
    letterSpacing: '0.02em',
  }

  return (
    <div style={wrap}>
      {options.showBrandBar && <div style={brandBarStyle} />}
      <div style={contentStyle}>
        {options.showPhoto && (
          <div style={photoBoxStyle}>
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={sneaker.name}
                style={photoImgStyle}
                crossOrigin="anonymous"
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 8 * scale,
                color: '#9CA3AF',
              }}>
                no photo
              </div>
            )}
          </div>
        )}
        <div style={textBoxStyle}>
          {sneaker.brand && <div style={brandStyle}>{sneaker.brand}</div>}
          <div style={nameStyle}>{sneaker.name}</div>
          {sneaker.colorway && <div style={colorwayStyle}>{sneaker.colorway}</div>}
          {options.showSize && sizeText.length > 0 && (
            <div style={sizeStyle}>{sizeText.join(' · ')}</div>
          )}
        </div>
        {options.showQR && <div style={qrStyle}>QR</div>}
        <div style={footerStyle}>shooserie.tech</div>
      </div>
    </div>
  )
}
'@
Write-FileUtf8NoBom -Path "src/components/StickerPreview.tsx" -Content $stickerPreviewTsx
Write-Host "  +  src/components/StickerPreview.tsx (flexbox)" -ForegroundColor Green

# ============================================================
# 2. stickerPdf.ts (photo 38mm + texte ajuste)
# ============================================================
$stickerPdfTs = @'
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
    const response = await fetch(url, { mode: 'cors' })
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
Write-FileUtf8NoBom -Path "src/lib/stickerPdf.ts" -Content $stickerPdfTs
Write-Host "  +  src/lib/stickerPdf.ts (photo 38mm)" -ForegroundColor Green

Write-Host ""
Write-Host "=== Fix layout termine ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resume des changements :" -ForegroundColor Yellow
Write-Host "  - Photo passee de 28x28mm a 38x38mm (+36%)" -ForegroundColor White
Write-Host "  - StickerPreview en flexbox (vs position absolute) -> plus de risque d'overlap" -ForegroundColor White
Write-Host "  - Texte clamp a 2 lignes pour le nom (evite le debordement)" -ForegroundColor White
Write-Host "  - Taille EU/US poussee en bas du bloc texte (au-dessus du QR)" -ForegroundColor White
Write-Host "  - Reserve d'espace dans le textBox pour eviter chevauchement avec QR" -ForegroundColor White
Write-Host ""
Write-Host "Etapes :" -ForegroundColor Yellow
Write-Host "  1. npm run build" -ForegroundColor Yellow
Write-Host "  2. git add -A" -ForegroundColor Yellow
Write-Host "  3. git commit -m 'fix(labels): bigger photo 38mm + flexbox layout, no text overlap'" -ForegroundColor Yellow
Write-Host "  4. git push origin dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backups dispos : .bak des 2 fichiers" -ForegroundColor DarkGray
Write-Host ""
