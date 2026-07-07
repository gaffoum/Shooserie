/**
 * WearTracker — section "Portée" sur la fiche sneaker.
 * Compteur + statut dérivé + boutons +1 / -1 / Reset (modale).
 *
 * Usage :
 *   <WearTracker
 *     sneakerId={sneaker.id}
 *     wearCount={sneaker.wear_count}
 *     lastWornAt={sneaker.last_worn_at}
 *   />
 */
import { useState } from 'react'
import type { CSSProperties } from 'react'
import {
  useIncrementWear,
  useDecrementWear,
  useResetWears,
  wearStatus,
  wearStatusLabel,
  WEAR_STATUS_COLORS,
} from '../lib/wears'

interface WearTrackerProps {
  sneakerId: string
  wearCount: number | null | undefined
  lastWornAt: string | null | undefined
}

export function WearTracker({
  sneakerId,
  wearCount,
  lastWornAt,
}: WearTrackerProps) {
  const inc = useIncrementWear()
  const dec = useDecrementWear()
  const reset = useResetWears()
  const [confirmReset, setConfirmReset] = useState(false)

  const count = wearCount ?? 0
  const status = wearStatus(count)
  const colors = WEAR_STATUS_COLORS[status]
  const busy = inc.isPending || dec.isPending || reset.isPending

  return (
    <div style={cardStyle}>
      <div style={topRowStyle}>
        <div>
          <div style={labelStyle}>Portée</div>
          <div style={countStyle}>
            <span style={countNumberStyle}>{count}</span>
            <span style={countUnitStyle}>
              {count > 1 ? 'fois' : count === 1 ? 'fois' : 'fois'}
            </span>
          </div>
        </div>
        <span
          style={{
            ...badgeStyle,
            background: colors.bg,
            color: colors.fg,
            borderColor: colors.border,
          }}
          title={wearStatusLabel(status)}
        >
          {status}
        </span>
      </div>

      {lastWornAt && (
        <div style={lastWornStyle}>
          Dernier port :{' '}
          {new Date(lastWornAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      )}

      <div style={btnRowStyle}>
        <button
          type="button"
          onClick={() => dec.mutate(sneakerId)}
          disabled={busy || count === 0}
          style={count === 0 ? secondaryBtnDisabledStyle : secondaryBtnStyle}
          aria-label="Décrémenter le compteur"
        >
          −1
        </button>
        <button
          type="button"
          onClick={() => inc.mutate(sneakerId)}
          disabled={busy}
          style={primaryBtnStyle}
        >
          +1 wear
        </button>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          disabled={busy || count === 0}
          style={count === 0 ? resetBtnDisabledStyle : resetBtnStyle}
        >
          Reset
        </button>
      </div>

      {(inc.isError || dec.isError || reset.isError) && (
        <div style={errorStyle}>
          {(inc.error || dec.error || reset.error)?.message ??
            'Erreur, réessaie.'}
        </div>
      )}

      {confirmReset && (
        <ResetModal
          onConfirm={() => {
            reset.mutate(sneakerId)
            setConfirmReset(false)
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  )
}

function ResetModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={modalTitleStyle}>Réinitialiser le compteur ?</h3>
        <p style={modalTextStyle}>
          Le statut reviendra à <strong>DS</strong> et la date du dernier port
          sera effacée. Cette action est définitive.
        </p>
        <div style={modalBtnRowStyle}>
          <button type="button" onClick={onCancel} style={secondaryBtnStyle}>
            Annuler
          </button>
          <button type="button" onClick={onConfirm} style={dangerBtnStyle}>
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  )
}

// =================================================================
// Styles — design tokens Shooserie
// =================================================================
const FONT = "'Outfit', sans-serif"
const TEXT = 'var(--color-text)'
const MUTED = 'var(--color-text-muted)'
const BORDER = 'var(--color-border)'
const RED = 'var(--color-bred)'
const CARD = 'var(--color-surface)'
const SOFT = 'var(--color-surface-alt)'

const cardStyle: CSSProperties = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 20,
  fontFamily: FONT,
  color: TEXT,
}

const topRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 12,
}

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: MUTED,
  marginBottom: 4,
}

const countStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
}

const countNumberStyle: CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
  color: TEXT,
}

const countUnitStyle: CSSProperties = {
  fontSize: 14,
  color: MUTED,
}

const badgeStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.04em',
  padding: '6px 12px',
  borderRadius: 999,
  border: '1px solid',
  whiteSpace: 'nowrap',
}

const lastWornStyle: CSSProperties = {
  fontSize: 13,
  color: MUTED,
  marginBottom: 16,
}

const btnRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const baseBtn: CSSProperties = {
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 600,
  padding: '10px 18px',
  border: '1px solid',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'background 120ms ease, opacity 120ms ease',
}

const primaryBtnStyle: CSSProperties = {
  ...baseBtn,
  flex: '1 1 auto',
  background: RED,
  color: '#FFFFFF',
  borderColor: RED,
}

const secondaryBtnStyle: CSSProperties = {
  ...baseBtn,
  background: CARD,
  color: TEXT,
  borderColor: BORDER,
  minWidth: 60,
}

const secondaryBtnDisabledStyle: CSSProperties = {
  ...secondaryBtnStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
}

const resetBtnStyle: CSSProperties = {
  ...baseBtn,
  background: SOFT,
  color: MUTED,
  borderColor: BORDER,
}

const resetBtnDisabledStyle: CSSProperties = {
  ...resetBtnStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
}

const dangerBtnStyle: CSSProperties = {
  ...baseBtn,
  background: '#DC2626',
  color: '#FFFFFF',
  borderColor: '#B91C1C',
}

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '8px 12px',
  background: '#FEE2E2',
  color: '#991B1B',
  borderRadius: 6,
  fontSize: 13,
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
}

const modalStyle: CSSProperties = {
  background: CARD,
  borderRadius: 12,
  padding: 24,
  maxWidth: 420,
  width: '100%',
  fontFamily: FONT,
  color: TEXT,
}

const modalTitleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  margin: '0 0 12px',
}

const modalTextStyle: CSSProperties = {
  fontSize: 14,
  color: MUTED,
  margin: '0 0 20px',
  lineHeight: 1.5,
}

const modalBtnRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
}