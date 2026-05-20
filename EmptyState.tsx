import type { CSSProperties, ReactNode } from 'react'

interface KpiCardProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  /** Couleur de la valeur principale (défaut: --color-text) */
  valueColor?: string
  /** Sparkline en filigrane derrière la valeur (placeholder Phase 2) */
  sparkline?: ReactNode
}

export function KpiCard({ label, value, sub, valueColor, sparkline }: KpiCardProps) {
  return (
    <div style={cardStyle}>
      {sparkline && <div style={sparklineWrap}>{sparkline}</div>}
      <div style={contentStyle}>
        <div style={labelStyle}>{label}</div>
        <div style={{ ...valueStyle, color: valueColor || 'var(--color-text)' }}>
          {value}
        </div>
        {sub && <div style={subStyle}>{sub}</div>}
      </div>
    </div>
  )
}

const cardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 14,
  position: 'relative',
  overflow: 'hidden',
  minWidth: 0,
}

const sparklineWrap: CSSProperties = {
  position: 'absolute',
  inset: 'auto 0 0 0',
  height: '60%',
  opacity: 0.28,
  pointerEvents: 'none',
}

const contentStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
}

const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 10,
  fontWeight: 500,
}

const valueStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 22,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
  wordBreak: 'break-word',
}

const subStyle: CSSProperties = {
  fontSize: 11,
  marginTop: 6,
  color: 'var(--color-bred)',
  fontVariantNumeric: 'tabular-nums',
}
