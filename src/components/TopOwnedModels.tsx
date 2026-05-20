import { useT } from '@/i18n/I18nContext'
import { useTopOwnedModels } from '@/lib/queries'
import { SneakerPhoto } from './SneakerPhoto'
import type { CSSProperties } from 'react'

/**
 * Community "Top N" panel: shows the most-owned models across all users.
 *
 * Layout: horizontal scrollable strip of vertical cards. Photo on top
 * (where the user's eye lands first — sneakers are a visual category),
 * meta-text below. Matches the visual rhythm of the main grid's SneakerCard
 * so it doesn't feel like a foreign module.
 *
 * Auto-hides when the leaderboard is empty (fresh app state).
 */
export function TopOwnedModels({ limit = 5 }: { limit?: number }) {
  const { t } = useT()
  const { data, isLoading } = useTopOwnedModels(limit)

  // Don't flash an empty panel during the very first load, and hide entirely
  // if there's no data to show (fresh app state).
  if (isLoading || !data || data.length === 0) return null

  return (
    <section style={sectionStyle} aria-label={t('community.top.title')}>
      <header style={headerStyle}>
        <h2 style={titleStyle}>{t('community.top.title')}</h2>
        <span style={subtitleStyle}>{t('community.top.subtitle')}</span>
      </header>
      <ol style={listStyle}>
        {data.map((model, idx) => (
          <li key={model.stockx_product_id} style={itemStyle}>
            {/* Photo container — `position: relative` is REQUIRED here because
                SneakerPhoto renders its <img> with position: absolute. Without
                this, the image would escape the container and fill the
                nearest positioned ancestor (the <li> in our case) which
                visually covered the entire card. */}
            <div style={photoStyle}>
              <SneakerPhoto
                stockxUrl={model.stockx_image_url}
                storagePath={null}
                alt={model.name}
              />
              <span style={rankBadgeStyle} aria-hidden>
                #{idx + 1}
              </span>
            </div>
            <div style={metaStyle}>
              {model.brand && <div style={brandStyle}>{model.brand}</div>}
              <div style={nameStyle} title={model.name}>
                {model.name}
              </div>
              <div style={countStyle}>
                👥 {model.owner_count}{' '}
                {model.owner_count === 1
                  ? t('community.collector.one')
                  : t('community.collector.many')}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

const sectionStyle: CSSProperties = {
  marginBottom: 20,
}
const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 10,
  marginBottom: 10,
}
const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 12,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  fontWeight: 500,
}
const subtitleStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-faint)',
}
const listStyle: CSSProperties = {
  // Horizontal scrolling strip with momentum on mobile, no visible scrollbar
  // on desktop. 5 cards × 160px + gaps fit a single laptop row; phones see
  // ~2.5 cards at once and swipe through the rest.
  display: 'flex',
  gap: 10,
  overflowX: 'auto',
  overflowY: 'hidden',
  padding: '2px 0 8px',
  margin: 0,
  listStyle: 'none',
  scrollbarWidth: 'thin',
  WebkitOverflowScrolling: 'touch',
}
const itemStyle: CSSProperties = {
  flex: '0 0 auto',
  width: 160,
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}
const photoStyle: CSSProperties = {
  // CRITICAL: position: relative so the absolutely-positioned <img> inside
  // SneakerPhoto is contained here and not bubbling up to the <li>.
  position: 'relative',
  width: '100%',
  // Square photo area. The image inside uses object-fit: contain so any
  // catalog aspect ratio fits without cropping the shoe.
  aspectRatio: '1 / 1',
  background: 'var(--color-bg)',
  borderBottom: '1px solid var(--color-border)',
}
const rankBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: 6,
  left: 6,
  padding: '2px 7px',
  background: 'rgba(10, 10, 10, 0.78)',
  color: '#FFFFFF',
  fontFamily: 'var(--font-display)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-wide)',
  borderRadius: 'var(--radius-sm)',
  fontVariantNumeric: 'tabular-nums',
  zIndex: 1,
}
const metaStyle: CSSProperties = {
  padding: '10px 11px 11px',
  minWidth: 0,
}
const brandStyle: CSSProperties = {
  fontSize: 9,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-faint)',
  fontWeight: 500,
  marginBottom: 3,
}
const nameStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text)',
  // 2-line clamp keeps card heights consistent regardless of model name length.
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  lineHeight: 1.3,
  marginBottom: 6,
  minHeight: 31, // (12 * 1.3) * 2 → reserves space even for 1-line names
}
const countStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  fontVariantNumeric: 'tabular-nums',
}
