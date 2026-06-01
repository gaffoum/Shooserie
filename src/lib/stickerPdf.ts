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