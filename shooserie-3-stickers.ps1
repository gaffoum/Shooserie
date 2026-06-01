# ============================================================
#  Shooserie - Sticker Sheet (/labels)
#  Format Avery L7165 / J8165 : 99x67 mm, 8 par page A4
#
#  - npm i jspdf qrcode + @types/qrcode
#  - src/lib/brandColors.ts  : map couleurs marques (bande gauche)
#  - src/lib/stickerPdf.ts   : generation PDF cote client
#  - src/components/StickerPreview.tsx : apercu SVG temps reel
#  - src/components/SneakerSelectCard.tsx : carte avec checkbox
#  - src/pages/Labels.tsx    : page complete
#  - patch App.tsx           : route /labels
#  - patch Dashboard.tsx     : bouton "Imprimer etiquettes"
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $Path), $Content, (New-Object System.Text.UTF8Encoding $false))
}
function Read-FileUtf8 {
    param([string]$Path)
    [System.IO.File]::ReadAllText((Join-Path (Get-Location).Path $Path), [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "=== Script 3/3 : Stickers (/labels) ===" -ForegroundColor Cyan

# ============================================================
# 0. npm install jspdf + qrcode
# ============================================================
Write-Host ""
Write-Host "  Installation des dependances..." -ForegroundColor Yellow
$npmOut = npm i jspdf qrcode 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR  npm i a echoue" -ForegroundColor Red
    Write-Host $npmOut -ForegroundColor Red
    exit 1
}
$npmOut2 = npm i -D '@types/qrcode' 2>&1 | Out-String
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARN  npm i @types/qrcode a echoue (non bloquant si jspdf et qrcode sont la)" -ForegroundColor Yellow
}
Write-Host "  +  jspdf, qrcode, @types/qrcode installes" -ForegroundColor Green

# ============================================================
# 1. src/lib/brandColors.ts
# ============================================================
$brandColorsTs = @'
/**
 * Couleurs accent par marque, utilisees pour la bande verticale a gauche
 * du sticker. Permet d'identifier visuellement la marque d'un coup d'oeil
 * quand les boites sont stackees sur l'etagere.
 */

const BRAND_COLOR_MAP: Record<string, string> = {
  'NIKE':          '#FA5400',
  'AIR JORDAN':    '#CE1141',
  'JORDAN':        '#CE1141',
  'ADIDAS':        '#000000',
  'YEEZY':         '#A0826D',
  'NEW BALANCE':   '#666666',
  'ASICS':         '#0066CC',
  'OFF-WHITE':     '#FFA500',
  'CONVERSE':      '#1A1A1A',
  'VANS':          '#C8102E',
  'REEBOK':        '#E60028',
  'PUMA':          '#181818',
  'SAUCONY':       '#FFD700',
  'MIZUNO':        '#0067B1',
  'SALOMON':       '#00A4E0',
  'ON':            '#0E0E0E',
  'HOKA':          '#3FA9F5',
  'BALENCIAGA':    '#000000',
  'GOLDEN GOOSE':  '#C9A227',
  'COMMON PROJECTS': '#F5F5DC',
  'MAISON MARGIELA': '#FFFFFF',
}

/** Retourne la couleur de la marque, ou gris si inconnue. */
export function brandColor(brand: string | null | undefined): string {
  if (!brand) return '#9CA3AF'
  const normalized = brand.trim().toUpperCase()
  return BRAND_COLOR_MAP[normalized] ?? '#9CA3AF'
}
'@
Write-FileUtf8NoBom -Path "src/lib/brandColors.ts" -Content $brandColorsTs
Write-Host "  +  src/lib/brandColors.ts" -ForegroundColor Green

# ============================================================
# 2. src/lib/stickerPdf.ts
# ============================================================
$stickerPdfTs = @'
/**
 * Generation PDF de stickers au format Avery L7165 / J8165.
 *   - A4 portrait : 210 x 297 mm
 *   - 8 stickers par page (2 colonnes x 4 lignes)
 *   - Taille sticker : 99 x 67 mm
 *   - Marges : 5mm haut, 4.5mm gauche, gap horizontal 2.5mm, gap vertical 0
 *     (mesures officielles Avery L7165 standard)
 *
 * Tout est genere cote client via jsPDF + qrcode. Zero couts serveur.
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

// ====== Helpers internes ======
function getStickerPosition(indexInPage: number): { x: number; y: number } {
  const col = indexInPage % COLS
  const row = Math.floor(indexInPage / COLS)
  const x = MARGIN_LEFT + col * (STICKER_W + GAP_X)
  const y = MARGIN_TOP + row * (STICKER_H + GAP_Y)
  return { x, y }
}

/** Charge une image en dataURL (necessaire pour jsPDF.addImage). */
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

/** Genere un QR code en dataURL PNG. */
async function generateQrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    margin: 0,
    width: 200, // resolution interne
    color: { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
  })
}

/** Dessine un sticker individuel a la position (x, y). */
async function drawSticker(
  doc: jsPDF,
  sneaker: StickerSneaker,
  x: number,
  y: number,
  options: StickerOptions,
) {
  // Photo a gauche (28 x 28 mm)
  let photoLeftEnd = x + 4 // si pas de photo, le texte commence ici

  if (options.showPhoto) {
    const photoUrl = sneaker.stockx_image_url || sneaker.photo_url
    if (photoUrl) {
      const dataUrl = await loadImageAsDataUrl(photoUrl)
      if (dataUrl) {
        try {
          doc.addImage(dataUrl, 'PNG', x + 4, y + 4, 28, 28, undefined, 'FAST')
        } catch {
          // ignore les erreurs d'image (CORS, format, etc.)
        }
      }
    }
    photoLeftEnd = x + 4 + 28 + 4 // 4mm de gap apres la photo
  }

  // Bande couleur marque (a gauche, 3mm de large)
  if (options.showBrandBar) {
    const color = brandColor(sneaker.brand)
    const rgb = hexToRgb(color)
    doc.setFillColor(rgb.r, rgb.g, rgb.b)
    doc.rect(x, y, 3, STICKER_H, 'F')
    photoLeftEnd = Math.max(photoLeftEnd, x + 3 + 4)
    if (!options.showPhoto) photoLeftEnd = x + 3 + 4
  }

  // Bloc texte a droite
  const textX = photoLeftEnd
  const textWidth = STICKER_W - (textX - x) - 4

  // Marque (small uppercase)
  if (sneaker.brand) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(107, 114, 128)
    doc.text(sneaker.brand.toUpperCase(), textX, y + 10)
  }

  // Nom du modele (gros, bold)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(10, 10, 10)
  const nameLines = doc.splitTextToSize(sneaker.name || '(sans nom)', textWidth)
  // Limite a 2 lignes (sinon overflow)
  const displayLines = nameLines.slice(0, 2)
  doc.text(displayLines, textX, y + 15)
  let curY = y + 15 + displayLines.length * 4.5

  // Colorway (subtle)
  if (sneaker.colorway) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    const colorLines = doc.splitTextToSize(sneaker.colorway, textWidth).slice(0, 1)
    doc.text(colorLines, textX, curY + 2)
    curY += 5
  }

  // Taille
  if (options.showSize) {
    const parts: string[] = []
    if (sneaker.size_eu) parts.push(`EU ${sneaker.size_eu}`)
    if (sneaker.size_us) parts.push(`US ${sneaker.size_us}`)
    if (parts.length > 0) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(10, 10, 10)
      doc.text(parts.join(' · '), textX, curY + 5)
    }
  }

  // QR code (15 x 15 mm en bas a droite)
  if (options.showQR) {
    try {
      const url = `${options.qrBaseUrl}/${sneaker.id}`
      const qrData = await generateQrDataUrl(url)
      doc.addImage(qrData, 'PNG', x + STICKER_W - 18, y + STICKER_H - 18, 14, 14, undefined, 'FAST')
    } catch {
      // ignore si QR genere echoue
    }
  }

  // Footer branding (tres petit, en bas)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(5.5)
  doc.setTextColor(156, 163, 175)
  doc.text('shooserie.tech', textX, y + STICKER_H - 3)
}

/** Convertit un hex color (#RRGGBB) en {r, g, b}. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return { r, g, b }
}

// ====== API publique ======

/**
 * Genere un PDF blob de stickers pour les paires donnees.
 * Multi-page automatique si > 8 paires.
 */
export async function generateStickerPdf(
  sneakers: StickerSneaker[],
  options: Partial<StickerOptions> = {},
): Promise<Blob> {
  const opts: StickerOptions = { ...DEFAULT_OPTIONS, ...options }
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  for (let i = 0; i < sneakers.length; i++) {
    const indexInPage = i % PER_PAGE
    if (i > 0 && indexInPage === 0) {
      doc.addPage()
    }
    const { x, y } = getStickerPosition(indexInPage)
    // eslint-disable-next-line no-await-in-loop
    await drawSticker(doc, sneakers[i], x, y, opts)
  }

  return doc.output('blob')
}

/** Telecharge un PDF blob avec un nom de fichier propre. */
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
Write-Host "  +  src/lib/stickerPdf.ts" -ForegroundColor Green

# ============================================================
# 3. src/components/StickerPreview.tsx
# ============================================================
$stickerPreviewTsx = @'
/**
 * StickerPreview — apercu SVG d'un sticker, dimensions scaled.
 * Sert d'aperçu en temps reel dans /labels.
 */
import type { CSSProperties } from 'react'
import { brandColor } from '@/lib/brandColors'
import type { StickerSneaker, StickerOptions } from '@/lib/stickerPdf'

interface StickerPreviewProps {
  sneaker: StickerSneaker
  options: StickerOptions
  /** Echelle (1 = 99x67mm a 96dpi ~ 374x254px). */
  scale?: number
}

export function StickerPreview({ sneaker, options, scale = 2 }: StickerPreviewProps) {
  // 1mm ≈ 3.78px a 96dpi. Avec scale=2 → ~7.56px/mm
  const PX_PER_MM = 3.78 * scale
  const w = 99 * PX_PER_MM
  const h = 67.7 * PX_PER_MM

  const wrap: CSSProperties = {
    position: 'relative',
    width: w,
    height: h,
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    fontFamily: "'Outfit', sans-serif",
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }

  const brandBarStyle: CSSProperties = {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: 3 * PX_PER_MM,
    background: brandColor(sneaker.brand),
  }

  const photoLeft = options.showBrandBar ? 3 * PX_PER_MM + 4 * PX_PER_MM : 4 * PX_PER_MM
  const photoSize = 28 * PX_PER_MM
  const photoUrl = sneaker.stockx_image_url || sneaker.photo_url

  const photoStyle: CSSProperties = {
    position: 'absolute',
    top: 4 * PX_PER_MM,
    left: photoLeft,
    width: photoSize,
    height: photoSize,
    objectFit: 'contain',
  }

  const textLeft = options.showPhoto
    ? photoLeft + photoSize + 4 * PX_PER_MM
    : photoLeft

  const textStyle: CSSProperties = {
    position: 'absolute',
    top: 6 * PX_PER_MM,
    left: textLeft,
    right: 4 * PX_PER_MM,
  }

  const qrSize = 14 * PX_PER_MM
  const qrStyle: CSSProperties = {
    position: 'absolute',
    bottom: 4 * PX_PER_MM,
    right: 4 * PX_PER_MM,
    width: qrSize,
    height: qrSize,
    background: '#0A0A0A',
    color: '#FFFFFF',
    fontSize: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const footerStyle: CSSProperties = {
    position: 'absolute',
    bottom: 2 * PX_PER_MM,
    left: textLeft,
    fontSize: 6 * scale,
    color: '#9CA3AF',
  }

  const sizeText: string[] = []
  if (sneaker.size_eu) sizeText.push(`EU ${sneaker.size_eu}`)
  if (sneaker.size_us) sizeText.push(`US ${sneaker.size_us}`)

  return (
    <div style={wrap}>
      {options.showBrandBar && <div style={brandBarStyle} />}
      {options.showPhoto && photoUrl && (
        <img src={photoUrl} alt={sneaker.name} style={photoStyle} crossOrigin="anonymous" />
      )}
      <div style={textStyle}>
        {sneaker.brand && (
          <div style={{ fontSize: 7 * scale, color: '#6B7280', letterSpacing: '0.04em' }}>
            {sneaker.brand.toUpperCase()}
          </div>
        )}
        <div style={{
          fontSize: 11 * scale, fontWeight: 700, color: '#0A0A0A',
          marginTop: 2, lineHeight: 1.15,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {sneaker.name}
        </div>
        {sneaker.colorway && (
          <div style={{
            fontSize: 8 * scale, color: '#6B7280', marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {sneaker.colorway}
          </div>
        )}
        {options.showSize && sizeText.length > 0 && (
          <div style={{ fontSize: 9 * scale, fontWeight: 700, color: '#0A0A0A', marginTop: 4 }}>
            {sizeText.join(' · ')}
          </div>
        )}
      </div>
      {options.showQR && <div style={qrStyle}>QR</div>}
      <div style={footerStyle}>shooserie.tech</div>
    </div>
  )
}
'@
Write-FileUtf8NoBom -Path "src/components/StickerPreview.tsx" -Content $stickerPreviewTsx
Write-Host "  +  src/components/StickerPreview.tsx" -ForegroundColor Green

# ============================================================
# 4. src/components/SneakerSelectCard.tsx
# ============================================================
$selectCardTsx = @'
/**
 * SneakerSelectCard — carte avec checkbox dans le coin haut-droit.
 * Utilisee dans /labels pour multi-select des paires a imprimer.
 */
import type { CSSProperties } from 'react'

interface SneakerSelectCardProps {
  id: string
  name: string
  brand: string | null
  photoUrl: string | null
  selected: boolean
  onToggle: (id: string) => void
}

export function SneakerSelectCard({
  id, name, brand, photoUrl, selected, onToggle,
}: SneakerSelectCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(id)}
      style={selected ? cardSelectedStyle : cardStyle}
      aria-pressed={selected}
    >
      <div style={imageWrapStyle}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} style={imgStyle} />
        ) : (
          <div style={imgPlaceholderStyle} />
        )}
      </div>
      <div style={infoStyle}>
        {brand && <div style={brandStyle}>{brand.toUpperCase()}</div>}
        <div style={nameStyle}>{name}</div>
      </div>
      <div style={selected ? checkSelectedStyle : checkStyle}>
        {selected && <span style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 700 }}>✓</span>}
      </div>
    </button>
  )
}

const cardStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  padding: 12,
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
  textAlign: 'center',
  transition: 'border-color 120ms, transform 120ms',
}
const cardSelectedStyle: CSSProperties = {
  ...cardStyle,
  border: '2px solid #CE1141',
  background: '#FFF5F7',
}
const imageWrapStyle: CSSProperties = {
  width: '100%',
  aspectRatio: '4 / 3',
  background: '#F9FAFB',
  borderRadius: 6,
  overflow: 'hidden',
  marginBottom: 8,
}
const imgStyle: CSSProperties = {
  width: '100%', height: '100%', objectFit: 'contain',
}
const imgPlaceholderStyle: CSSProperties = {
  width: '100%', height: '100%', background: '#F3F4F6',
}
const infoStyle: CSSProperties = { width: '100%' }
const brandStyle: CSSProperties = {
  fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
  color: '#6B7280', marginBottom: 2,
}
const nameStyle: CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#0A0A0A',
  lineHeight: 1.3,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}
const checkStyle: CSSProperties = {
  position: 'absolute',
  top: 8, right: 8,
  width: 22, height: 22,
  borderRadius: '50%',
  border: '2px solid #E5E7EB',
  background: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const checkSelectedStyle: CSSProperties = {
  ...checkStyle,
  background: '#CE1141',
  border: '2px solid #CE1141',
}
'@
Write-FileUtf8NoBom -Path "src/components/SneakerSelectCard.tsx" -Content $selectCardTsx
Write-Host "  +  src/components/SneakerSelectCard.tsx" -ForegroundColor Green

# ============================================================
# 5. src/pages/Labels.tsx
# ============================================================
$labelsTsx = @'
/**
 * Labels — page de generation de stickers pour les boites.
 * Format Avery L7165 / J8165 : 99x67mm, 8 par page A4.
 *
 * Workflow :
 *  1. Fetch toutes les paires du user
 *  2. Multi-select via SneakerSelectCard
 *  3. Toggle des options (photo, taille, QR, bande marque)
 *  4. Preview live du 1er sticker
 *  5. Generation PDF cote client (jsPDF) + download
 */
import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { SneakerSelectCard } from '../components/SneakerSelectCard'
import { StickerPreview } from '../components/StickerPreview'
import { supabase } from '../lib/supabase'
import {
  generateStickerPdf,
  downloadBlob,
  type StickerSneaker,
  type StickerOptions,
} from '../lib/stickerPdf'

const DEFAULT_OPTIONS: StickerOptions = {
  showPhoto: true,
  showSize: true,
  showQR: true,
  showBrandBar: true,
  qrBaseUrl: 'https://shooserie.tech/sneakers',
}

function useMySneakersForLabels() {
  return useQuery({
    queryKey: ['my-sneakers-labels'],
    queryFn: async (): Promise<StickerSneaker[]> => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) return []
      const { data, error } = await supabase
        .from('sneakers')
        .select('id, name, brand, colorway, size_eu, size_us, stockx_image_url, photo_url')
        .eq('user_id', userId)
        .order('brand', { ascending: true })
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as StickerSneaker[]
    },
    staleTime: 60 * 1000,
  })
}

export default function Labels() {
  const sneakersQ = useMySneakersForLabels()
  const sneakers = sneakersQ.data ?? []

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [options, setOptions] = useState<StickerOptions>(DEFAULT_OPTIONS)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [isGenerating, setIsGenerating] = useState(false)

  const brands = useMemo(() => {
    const set = new Set<string>()
    for (const s of sneakers) if (s.brand) set.add(s.brand)
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [sneakers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sneakers.filter((s) => {
      if (brandFilter !== 'all' && s.brand !== brandFilter) return false
      if (q && !`${s.name} ${s.brand ?? ''} ${s.colorway ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [sneakers, brandFilter, search])

  const selectedSneakers = useMemo(
    () => sneakers.filter((s) => selected.has(s.id)),
    [sneakers, selected],
  )

  const pagesCount = Math.ceil(selectedSneakers.length / 8)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filtered.map((s) => s.id)))
  }

  function selectNone() {
    setSelected(new Set())
  }

  async function handleGenerate() {
    if (selectedSneakers.length === 0) return
    setIsGenerating(true)
    try {
      const blob = await generateStickerPdf(selectedSneakers, options)
      const filename = `shooserie-stickers-${new Date().toISOString().slice(0, 10)}.pdf`
      downloadBlob(blob, filename)
    } catch (err) {
      console.error('PDF generation failed', err)
      alert("La génération du PDF a échoué. Vérifie la console.")
    } finally {
      setIsGenerating(false)
    }
  }

  if (sneakersQ.isLoading) {
    return (
      <>
        <AppHeader leftActions={<BackButton />} />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Étiquettes</h1>
          <p style={mutedStyle}>Chargement de ta collec…</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={pageStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>ÉTIQUETTES</h1>
          <p style={subtitleStyle}>
            Format Avery L7165 / J8165 · 99 × 67 mm · 8 par page A4
          </p>
        </header>

        {/* Preview live (1er sticker selectionne ou 1er filtre) */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>APERÇU</h2>
          <div style={previewWrapStyle}>
            {selectedSneakers[0] || filtered[0] ? (
              <StickerPreview
                sneaker={selectedSneakers[0] || filtered[0]}
                options={options}
                scale={1.4}
              />
            ) : (
              <div style={emptyPreviewStyle}>Aucune paire à prévisualiser</div>
            )}
          </div>
        </section>

        {/* Options */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>OPTIONS</h2>
          <div style={optionsRowStyle}>
            <OptionToggle
              checked={options.showPhoto}
              onChange={(v) => setOptions({ ...options, showPhoto: v })}
              label="Photo"
            />
            <OptionToggle
              checked={options.showSize}
              onChange={(v) => setOptions({ ...options, showSize: v })}
              label="Taille"
            />
            <OptionToggle
              checked={options.showQR}
              onChange={(v) => setOptions({ ...options, showQR: v })}
              label="QR code"
            />
            <OptionToggle
              checked={options.showBrandBar}
              onChange={(v) => setOptions({ ...options, showBrandBar: v })}
              label="Bande marque"
            />
          </div>
        </section>

        {/* Toolbar */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            SÉLECTION ({selectedSneakers.length} / {sneakers.length})
            {pagesCount > 0 && (
              <span style={pagesBadgeStyle}>
                {pagesCount} page{pagesCount > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <div style={toolbarStyle}>
            <input
              type="text"
              placeholder="Rechercher (modèle, marque…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">Toutes les marques</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <button type="button" onClick={selectAll} style={ghostBtnStyle}>
              Tout sélectionner
            </button>
            <button type="button" onClick={selectNone} style={ghostBtnStyle}>
              Aucun
            </button>
          </div>

          <div style={cardsGridStyle}>
            {filtered.map((s) => (
              <SneakerSelectCard
                key={s.id}
                id={s.id}
                name={s.name}
                brand={s.brand}
                photoUrl={s.stockx_image_url || s.photo_url}
                selected={selected.has(s.id)}
                onToggle={toggle}
              />
            ))}
          </div>
        </section>

        {/* CTA generation */}
        <div style={ctaWrapStyle}>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={selectedSneakers.length === 0 || isGenerating}
            style={selectedSneakers.length === 0 || isGenerating ? ctaDisabledStyle : ctaStyle}
          >
            {isGenerating
              ? 'Génération…'
              : `📄 Télécharger ${selectedSneakers.length} sticker${selectedSneakers.length > 1 ? 's' : ''} en PDF`
            }
          </button>
          <p style={hintStyle}>
            Imprime sur planche Avery L7165 / J8165 (8 stickers par feuille A4).
            Vendue ~8€/10 planches en supermarché ou bureau-tabac.
          </p>
        </div>
      </div>
    </>
  )
}

function OptionToggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={toggleLabelStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginRight: 6 }}
      />
      {label}
    </label>
  )
}

// =================================================================
// Styles
// =================================================================
const pageStyle: CSSProperties = {
  maxWidth: 900, margin: '0 auto',
  padding: '24px 16px 80px',
  fontFamily: "'Outfit', sans-serif",
}
const headerStyle: CSSProperties = { marginBottom: 24 }
const titleStyle: CSSProperties = {
  fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em',
  color: '#0A0A0A', margin: 0, lineHeight: 1.05,
}
const subtitleStyle: CSSProperties = {
  fontSize: 13, color: '#6B7280', marginTop: 8,
}
const mutedStyle: CSSProperties = { color: '#6B7280', fontSize: 13 }

const sectionStyle: CSSProperties = { marginBottom: 28 }
const sectionTitleStyle: CSSProperties = {
  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#0A0A0A', margin: '0 0 12px',
  display: 'flex', alignItems: 'center', gap: 8,
}
const pagesBadgeStyle: CSSProperties = {
  marginLeft: 8, fontSize: 11, color: '#6B7280',
  fontWeight: 500, letterSpacing: 'normal', textTransform: 'none',
}

const previewWrapStyle: CSSProperties = {
  display: 'flex', justifyContent: 'center', padding: 16,
  background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB',
}
const emptyPreviewStyle: CSSProperties = {
  padding: 60, color: '#9CA3AF', fontSize: 13,
}

const optionsRowStyle: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 12,
  padding: 14, background: '#FFFFFF', borderRadius: 10,
  border: '1px solid #E5E7EB',
}
const toggleLabelStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  fontSize: 13, color: '#0A0A0A', cursor: 'pointer',
}

const toolbarStyle: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12,
}
const inputStyle: CSSProperties = {
  flex: '1 1 200px',
  padding: '8px 12px', fontSize: 13, borderRadius: 8,
  border: '1px solid #E5E7EB', fontFamily: 'inherit',
}
const selectStyle: CSSProperties = {
  padding: '8px 12px', fontSize: 13, borderRadius: 8,
  border: '1px solid #E5E7EB', background: '#FFFFFF',
  fontFamily: 'inherit',
}
const ghostBtnStyle: CSSProperties = {
  padding: '8px 14px', fontSize: 12, fontWeight: 600,
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 8, color: '#0A0A0A', cursor: 'pointer',
  fontFamily: 'inherit',
}

const cardsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: 12,
}

const ctaWrapStyle: CSSProperties = {
  position: 'sticky', bottom: 0,
  background: 'rgba(249, 250, 251, 0.95)',
  backdropFilter: 'blur(8px)',
  padding: '16px 0',
  marginTop: 24,
  borderTop: '1px solid #E5E7EB',
  textAlign: 'center',
}
const ctaStyle: CSSProperties = {
  background: '#CE1141', color: '#FFFFFF',
  fontSize: 15, fontWeight: 700,
  padding: '14px 32px', border: 'none',
  borderRadius: 999, cursor: 'pointer',
  fontFamily: 'inherit', letterSpacing: '0.01em',
}
const ctaDisabledStyle: CSSProperties = {
  ...ctaStyle,
  background: '#E5E7EB', color: '#9CA3AF', cursor: 'not-allowed',
}
const hintStyle: CSSProperties = {
  marginTop: 10, fontSize: 11, color: '#6B7280',
  maxWidth: 420, marginInline: 'auto',
}
'@
Write-FileUtf8NoBom -Path "src/pages/Labels.tsx" -Content $labelsTsx
Write-Host "  +  src/pages/Labels.tsx" -ForegroundColor Green

# ============================================================
# 6. Patch App.tsx : import + route /labels
# ============================================================
$appPath = "src/App.tsx"
$app = Read-FileUtf8 $appPath
$app = $app -replace "\r?\n", "`r`n"

if ($app -notmatch "import Labels from") {
    $anchor = "import Rankings from './pages/Rankings';"
    if ($app.Contains($anchor)) {
        $app = $app.Replace($anchor, "$anchor`r`nimport Labels from './pages/Labels';")
        Write-Host "  +  Import Labels ajoute" -ForegroundColor Green
    }
}

if ($app -notmatch 'path="/labels"') {
    $newRoute = @'
        <Route
          path="/labels"
          element={
            <ProtectedRoute>
              <Labels />
            </ProtectedRoute>
          }
        />
      </Routes>
'@
    $app = $app.Replace("</Routes>", $newRoute.TrimStart())
    Write-Host "  +  Route /labels inseree" -ForegroundColor Green
}

Write-FileUtf8NoBom -Path $appPath -Content $app

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Get-ChildItem src/lib/brandColors.ts, src/lib/stickerPdf.ts, src/components/StickerPreview.tsx, src/components/SneakerSelectCard.tsx, src/pages/Labels.tsx -ErrorAction SilentlyContinue |
    ForEach-Object { "  + $($_.FullName.Replace((Get-Location).Path, '.').Replace('\','/'))" }
Select-String -Path $appPath -Pattern "Labels" | Select-Object -First 3 |
    ForEach-Object { "  App L$($_.LineNumber) : $($_.Line.Trim())" }

Write-Host ""
Write-Host "=== Script 3/3 termine ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Acces : https://shooserie.tech/labels (apres deploy)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pour ajouter un bouton 'Imprimer mes etiquettes' sur le Dashboard," -ForegroundColor Yellow
Write-Host "ajoute manuellement un Link vers /labels (par exemple a cote du bouton 'Voir tout ->')." -ForegroundColor Yellow
Write-Host ""
