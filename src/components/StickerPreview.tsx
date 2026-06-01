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