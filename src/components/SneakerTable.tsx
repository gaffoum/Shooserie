import { useNavigate } from 'react-router-dom'
import type { Sneaker } from '@/lib/types'
import { calcDelta, deltaBgColor, deltaColor, effectiveCost, formatEur, formatPct } from '@/lib/format'
import { useT } from '@/i18n/I18nContext'
import { SneakerPhoto } from './SneakerPhoto'
import { RefreshCoteButton } from './RefreshCoteButton'
import type { CSSProperties } from 'react'

interface SneakerTableProps {
  sneakers: Sneaker[]
}

export function SneakerTable({ sneakers }: SneakerTableProps) {
  const navigate = useNavigate()
  const { t } = useT()
  return (
    <div style={wrapStyle}>
      <table style={tableStyle}>
        <colgroup>
          <col style={{ width: 56 }} />
          <col />
          <col style={{ width: '20%' }} />
          <col style={{ width: 90 }} />
          <col style={{ width: 78 }} />
          <col style={{ width: 40 }} />
        </colgroup>
        <thead>
          <tr>
            <th style={thStyle}></th>
            <th style={thStyle}>{t('table.col.model')}</th>
            <th style={thStyle}>{t('table.col.size')}</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.col.cote')}</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>{t('table.col.delta')}</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {sneakers.map((s) => {
            const delta = calcDelta(effectiveCost(s), s.market_price)
            const sizeLabel = [s.size_eu && `EU ${s.size_eu}`, s.size_us && `US ${s.size_us}`]
              .filter(Boolean)
              .join(' · ')
            const priceShown = s.market_price ?? effectiveCost(s)
            return (
              <tr
                key={s.id}
                onClick={() => navigate(`/sneakers/${s.id}`)}
                style={rowStyle}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--color-surface-alt)')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={tdStyle}>
                  <div style={thumbStyle}>
                    <SneakerPhoto
                      stockxUrl={s.stockx_image_url}
                      storagePath={s.photo_url}
                      alt={s.name}
                    />
                  </div>
                </td>
                <td style={tdStyle}>
                  {s.brand && <div style={brandStyle}>{s.brand}</div>}
                  <div style={nameStyle}>{s.name}</div>
                </td>
                <td style={{ ...tdStyle, ...monoStyle }}>{sizeLabel || '—'}</td>
                <td style={{ ...tdStyle, textAlign: 'right', ...numStyle }}>
                  {formatEur(priceShown)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  {delta.pct !== null ? (
                    <span
                      style={{
                        ...deltaStyle,
                        background:
                          deltaBgColor(delta.pct) ?? 'var(--color-neutral-chip-bg)',
                        color: deltaColor(delta.pct),
                      }}
                    >
                      {formatPct(delta.pct, true)}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-faint)' }}>—</span>
                  )}
                </td>
                {/* Refresh button — stops propagation so it doesn't navigate */}
                <td style={{ ...tdStyle, textAlign: 'right', paddingLeft: 0 }}>
                  <RefreshCoteButton sneaker={s} variant="table" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
}
const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  fontSize: 12,
}
const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '11px 12px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  fontFamily: 'var(--font-display)',
  background: 'var(--color-bg)',
  borderBottom: '1px solid var(--color-border)',
}
const rowStyle: CSSProperties = {
  cursor: 'pointer',
  transition: 'background var(--transition-fast)',
}
const tdStyle: CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--color-border)',
  verticalAlign: 'middle',
}
const thumbStyle: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-bg)',
  overflow: 'hidden',
  position: 'relative',
}
const brandStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
  marginBottom: 2,
}
const nameStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text)',
  fontWeight: 500,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
const monoStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted)',
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '0.04em',
}
const numStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  fontVariantNumeric: 'tabular-nums',
}
const deltaStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  padding: '3px 8px',
  borderRadius: 'var(--radius-sm)',
  display: 'inline-block',
  // Keep the percentage on a single line — by default, the narrow +/- column
  // breaks the "%" sign onto its own line which looks broken.
  whiteSpace: 'nowrap',
}
