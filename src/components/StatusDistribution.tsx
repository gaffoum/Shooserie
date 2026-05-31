/**
 * StatusDistribution — repartition des paires par statut (page /rankings).
 * Barres colorees horizontales par statut + nombre + pourcentage.
 */
import type { CSSProperties } from 'react'
import { WEAR_STATUS_COLORS, type WearStatusCount } from '@/lib/wears'

interface StatusDistributionProps {
  data: WearStatusCount[]
}

export function StatusDistribution({ data }: StatusDistributionProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  if (total === 0) return null

  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>TA COLLEC PAR ÉTAT</h2>
      <div style={listStyle}>
        {data.map((d) => {
          const pct = (d.count / total) * 100
          const colors = WEAR_STATUS_COLORS[d.status]
          return (
            <div key={d.status} style={rowStyle}>
              <div style={labelStyle}>{d.status}</div>
              <div style={countStyle}>{d.count}</div>
              <div style={barTrackStyle}>
                <div
                  style={{
                    ...barFillStyle,
                    width: pct > 0 ? `${Math.max(pct, 1.5)}%` : '0',
                    background: colors.bg,
                  }}
                />
              </div>
              <div style={pctStyle}>{Math.round(pct)}%</div>
            </div>
          )
        })}
      </div>
      <p style={totalStyle}>
        {total} {total > 1 ? 'paires au total' : 'paire au total'}
      </p>
    </section>
  )
}

const sectionStyle: CSSProperties = { marginBottom: 32 }
const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display, \'Outfit\', sans-serif)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text, #0A0A0A)',
  margin: '0 0 16px',
}
const listStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  background: 'var(--color-surface, #FFFFFF)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: 12,
  padding: 16,
}
const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '70px 50px 1fr 45px',
  alignItems: 'center',
  gap: 12,
}
const labelStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--color-text, #0A0A0A)',
  letterSpacing: '0.02em',
}
const countStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-text, #0A0A0A)',
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
}
const barTrackStyle: CSSProperties = {
  height: 10,
  background: 'var(--color-bg, #F3F4F6)',
  borderRadius: 999,
  overflow: 'hidden',
}
const barFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
  transition: 'width 300ms ease',
}
const pctStyle: CSSProperties = {
  fontFamily: "'Outfit', sans-serif",
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--color-text-muted, #6B7280)',
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
}
const totalStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 12,
  color: 'var(--color-text-muted, #6B7280)',
  textAlign: 'right',
  fontFamily: "'Outfit', sans-serif",
}