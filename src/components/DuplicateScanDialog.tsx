import { useEffect, type CSSProperties } from 'react'
import { useT } from '@/i18n/I18nContext'
import type { Sneaker } from '@/lib/types'
import { SneakerPhoto } from './SneakerPhoto'

interface DuplicateScanDialogProps {
  open: boolean
  /** The existing sneakers matching the scanned product (by stockx_product_id,
   *  sku, or barcode). Caller decides matching strategy — this dialog just
   *  displays them so the user sees what they already have. */
  matches: Sneaker[]
  /** Triggered when user confirms "Add anyway" — caller then navigates to
   *  the new-sneaker form pre-filled with the scan defaults. */
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Soft warning shown when a barcode scan from the dashboard returns a product
 * the user already owns. Lists the existing pairs (with their sizes) so the
 * user can decide whether this is a legitimate duplicate (multiple copies of
 * the same model) or an accidental rescan.
 *
 * Click-outside, Escape key, and the Cancel button all dismiss. The "Add
 * anyway" button is the primary action (Bred) since the natural intent on a
 * scan is still to add — we just want awareness.
 */
export function DuplicateScanDialog({
  open,
  matches,
  onConfirm,
  onCancel,
}: DuplicateScanDialogProps) {
  const { t } = useT()

  // Esc to dismiss.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const count = matches.length
  const description =
    count === 1
      ? t('dashboard.scan.duplicate.descOne')
      : t('dashboard.scan.duplicate.descMany', { count: String(count) })

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="duplicate-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div style={dialogStyle}>
        <h2 id="duplicate-title" style={titleStyle}>
          {t('dashboard.scan.duplicate.title')}
        </h2>
        <p style={descStyle}>{description}</p>

        <ul style={listStyle}>
          {matches.slice(0, 5).map((s) => (
            <MatchRow key={s.id} sneaker={s} t={t} />
          ))}
          {matches.length > 5 && (
            <li style={moreStyle}>+ {matches.length - 5}…</li>
          )}
        </ul>

        <div style={actionsStyle}>
          <button type="button" onClick={onCancel} style={cancelBtnStyle}>
            {t('dashboard.scan.duplicate.cancel')}
          </button>
          <button type="button" onClick={onConfirm} style={confirmBtnStyle}>
            {t('dashboard.scan.duplicate.addAnyway')}
          </button>
        </div>
      </div>
    </div>
  )
}

function MatchRow({
  sneaker,
  t,
}: {
  sneaker: Sneaker
  t: (k: any, params?: Record<string, string>) => string
}) {
  // Use the same size logic the cards use: prefer US, fall back to EU.
  const sizeLabel = sneaker.size_us
    ? t('dashboard.scan.duplicate.matchSize', { size: `US ${sneaker.size_us}` })
    : sneaker.size_eu
      ? t('dashboard.scan.duplicate.matchSize', { size: `EU ${sneaker.size_eu}` })
      : t('dashboard.scan.duplicate.matchNoSize')

  return (
    <li style={rowStyle}>
      <div style={thumbStyle}>
        <SneakerPhoto
          stockxUrl={sneaker.stockx_image_url}
          storagePath={sneaker.photo_url}
          alt={sneaker.name}
        />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={nameStyle}>{sneaker.name}</div>
        <div style={sizeStyle}>{sizeLabel}</div>
      </div>
    </li>
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(10, 10, 10, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
}
const dialogStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  padding: '22px 22px 18px',
  maxWidth: 420,
  width: '100%',
  maxHeight: '90vh',
  overflowY: 'auto',
}
const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 17,
  fontWeight: 600,
  margin: '0 0 8px',
  color: 'var(--color-text)',
}
const descStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  margin: '0 0 14px',
}
const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '0 0 18px',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
}
const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  borderBottom: '1px solid var(--color-border)',
}
const moreStyle: CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
  color: 'var(--color-text-faint)',
  textAlign: 'center',
}
const thumbStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-sm)',
  overflow: 'hidden',
  flexShrink: 0,
  background: 'var(--color-surface)',
}
const nameStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const sizeStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  marginTop: 1,
}
const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
}
const cancelBtnStyle: CSSProperties = {
  padding: '9px 16px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 500,
  background: 'transparent',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
}
const confirmBtnStyle: CSSProperties = {
  padding: '9px 16px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
}
