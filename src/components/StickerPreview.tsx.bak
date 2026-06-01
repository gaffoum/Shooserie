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