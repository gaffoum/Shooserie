/**
 * Community — Leaderboard + Découvrir (/community). Vague 2 (handoff).
 *
 * 🔒 Confidentialité : le leaderboard lit la vue `leaderboard` (colonnes
 * minimales, filtrée leaderboard_visible=true). « Découvrir » liste les profils
 * publics via usePublicProfiles (sélect minimal : id/display_name/created_at).
 * Aucune donnée sensible (prix, email, code parrainage…) n'est requêtée.
 * Classement par stars_total desc. Ligne de l'utilisateur courant surlignée.
 */
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { useAuth } from '../contexts/AuthContext'
import { getRankDisplay } from '../lib/ranks'
import { useTheme } from '../contexts/ThemeContext'
import { useT, localeFor } from '@/i18n/I18nContext'
import {
  useLeaderboard,
  usePublicProfiles,
  type LeaderboardEntry,
  type CommunityMember,
} from '../lib/publicProfileQueries'

const MEDAL = ['🥇', '🥈', '🥉']

function profileHref(username: string | null, displayName: string | null): string | null {
  const handle = username || displayName
  return handle ? `/u/${encodeURIComponent(handle)}` : null
}

export default function Community() {
  const { t, lang } = useT()
  const { user } = useAuth()
  const lb = useLeaderboard()
  const discover = usePublicProfiles()
  const fmt = (n: number) => n.toLocaleString(localeFor(lang))

  const entries = lb.data ?? []
  const podium = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={pageStyle}>
        <div style={headerStyle}>
          <div className="lab" style={eyebrowStyle}>COMMUNAUTÉ</div>
          <h1 style={pageTitleStyle}>{t('community.leaderboard')}</h1>
        </div>

        {lb.isLoading ? (
          <div style={listStyle}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 68 }} />
            ))}
          </div>
        ) : lb.isError ? (
          <div style={emptyCardStyle}>
            <h2 style={emptyTitleStyle}>{t('community.error.title')}</h2>
            <p style={emptyTextStyle}>{t('community.error.desc')}</p>
          </div>
        ) : entries.length === 0 ? (
          <div style={emptyCardStyle}>
            <h2 style={emptyTitleStyle}>{t('community.empty.title')}</h2>
            <p style={emptyTextStyle}>{t('community.empty.desc')}</p>
          </div>
        ) : (
          <>
            {podium.length > 0 && (
              <div style={podiumStyle}>
                {orderPodium(podium).map(({ entry, rank }) => (
                  <PodiumCard
                    key={entry.id}
                    entry={entry}
                    rank={rank}
                    isMe={!!user && user.id === entry.id}
                    fmt={fmt}
                  />
                ))}
              </div>
            )}
            {rest.length > 0 && (
              <div style={listStyle}>
                {rest.map((e, i) => (
                  <LeaderRow
                    key={e.id}
                    entry={e}
                    position={i + 4}
                    isMe={!!user && user.id === e.id}
                    fmt={fmt}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Découvrir des collectionneurs */}
        {(discover.data?.length ?? 0) > 0 && (
          <section style={{ marginTop: 32 }}>
            <h2 style={sectionTitleStyle}>{t('community.discover')}</h2>
            <div style={listStyle}>
              {discover.data!.map((m) => (
                <DiscoverRow key={m.id} member={m} isMe={!!user && user.id === m.id} fmt={fmt} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

/** 2e à gauche · 1er au centre · 3e à droite. */
function orderPodium(top: LeaderboardEntry[]): Array<{ entry: LeaderboardEntry; rank: number }> {
  const wr = top.map((entry, i) => ({ entry, rank: i + 1 }))
  return [wr.find((x) => x.rank === 2), wr.find((x) => x.rank === 1), wr.find((x) => x.rank === 3)]
    .filter(Boolean) as Array<{ entry: LeaderboardEntry; rank: number }>
}

function RankIcon({ rank, size }: { rank: string; size: number }) {
  const { resolved } = useTheme()
  const d = getRankDisplay(rank)
  const src = resolved === 'dark' ? d.iconDark : d.iconLight
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      width={size}
      height={size}
      style={{ objectFit: 'contain', flexShrink: 0 }}
      onError={(e) => {
        e.currentTarget.style.visibility = 'hidden'
      }}
    />
  )
}

function PodiumCard({
  entry,
  rank,
  isMe,
  fmt,
}: {
  entry: LeaderboardEntry
  rank: number
  isMe: boolean
  fmt: (n: number) => string
}) {
  const first = rank === 1
  const href = profileHref(entry.username, entry.display_name)
  const name = entry.display_name || entry.username || '—'
  const Inner = (
    <>
      <div style={{ fontSize: first ? 26 : 22 }} aria-hidden>{MEDAL[rank - 1]}</div>
      <RankIcon rank={entry.rank} size={first ? 40 : 32} />
      <div style={podiumNameStyle}>{name}</div>
      <div style={podiumValueStyle}>⭐ {fmt(entry.stars_total)}</div>
      <div className="lab" style={podiumSubStyle}>{fmt(entry.pairs_count)} PAIRES</div>
      {isMe && <span style={mePillStyle}>TOI</span>}
    </>
  )
  const style: React.CSSProperties = {
    ...podiumCardStyle,
    marginTop: first ? 0 : 18,
    borderColor: isMe ? 'var(--color-bred)' : first ? 'var(--rarity-grail)' : 'var(--color-border)',
    boxShadow: first ? '0 0 22px rgba(231,169,60,0.28)' : undefined,
  }
  return href ? (
    <Link to={href} style={style}>{Inner}</Link>
  ) : (
    <div style={style}>{Inner}</div>
  )
}

function LeaderRow({
  entry,
  position,
  isMe,
  fmt,
}: {
  entry: LeaderboardEntry
  position: number
  isMe: boolean
  fmt: (n: number) => string
}) {
  const href = profileHref(entry.username, entry.display_name)
  const name = entry.display_name || entry.username || '—'
  const style: React.CSSProperties = {
    ...rowStyle,
    borderColor: isMe ? 'var(--color-bred)' : 'var(--color-border)',
    background: isMe ? 'var(--color-bred-bg)' : 'var(--color-surface)',
  }
  const Inner = (
    <>
      <div className="lab" style={rankNumStyle}>#{position}</div>
      <RankIcon rank={entry.rank} size={30} />
      <div style={rowNameWrapStyle}>
        <div style={rowNameStyle}>
          {name}
          {isMe && <span style={meTagStyle}>TOI</span>}
        </div>
        <div style={rowSubStyle}>{fmt(entry.pairs_count)} paires</div>
      </div>
      <div style={rowStatStyle}>
        <div style={rowStatValueStyle}>⭐ {fmt(entry.stars_total)}</div>
      </div>
    </>
  )
  return href ? <Link to={href} style={style}>{Inner}</Link> : <div style={style}>{Inner}</div>
}

function DiscoverRow({
  member,
  isMe,
  fmt,
}: {
  member: CommunityMember
  isMe: boolean
  fmt: (n: number) => string
}) {
  return (
    <Link
      to={`/u/${encodeURIComponent(member.display_name)}`}
      style={{
        ...rowStyle,
        borderColor: isMe ? 'var(--color-bred)' : 'var(--color-border)',
        background: isMe ? 'var(--color-bred-bg)' : 'var(--color-surface)',
      }}
    >
      <div style={rowNameWrapStyle}>
        <div style={rowNameStyle}>
          {member.display_name}
          {isMe && <span style={meTagStyle}>TOI</span>}
        </div>
        <div style={rowSubStyle}>{fmt(member.sneakers_count)} paires · {fmt(member.for_sale_count)} en vente</div>
      </div>
      <div style={rowChevronStyle} aria-hidden>›</div>
    </Link>
  )
}

// =================================================================
// Styles
// =================================================================
const pageStyle: React.CSSProperties = {
  maxWidth: 720,
  margin: '0 auto',
  padding: '24px 16px',
  fontFamily: 'var(--font-display)',
  color: 'var(--color-text)',
}
const headerStyle: React.CSSProperties = { marginBottom: 20 }
const eyebrowStyle: React.CSSProperties = { color: 'var(--color-bred)', fontSize: 10, letterSpacing: '2px' }
const pageTitleStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  letterSpacing: '-0.8px',
  margin: '2px 0 0',
  color: 'var(--color-text)',
}
const sectionTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  margin: '0 0 12px',
}

const podiumStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 10,
  alignItems: 'end',
  marginBottom: 18,
}
const podiumCardStyle: React.CSSProperties = {
  position: 'relative',
  background: 'var(--color-surface)',
  border: '1.5px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '14px 8px',
  textAlign: 'center',
  textDecoration: 'none',
  color: 'var(--color-text)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 5,
}
const podiumNameStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const podiumValueStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 900,
  letterSpacing: '-0.4px',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-bred)',
  lineHeight: 1,
}
const podiumSubStyle: React.CSSProperties = {
  fontSize: 8,
  letterSpacing: '1px',
  color: 'var(--color-text-muted)',
}
const mePillStyle: React.CSSProperties = {
  position: 'absolute',
  top: 8,
  right: 8,
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '1px',
  padding: '2px 6px',
  borderRadius: 100,
  background: 'var(--color-bred)',
  color: '#fff',
  fontFamily: 'var(--font-mono)',
}

const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }
const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '12px 14px',
  textDecoration: 'none',
  color: 'var(--color-text)',
}
const rankNumStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted)',
  minWidth: 28,
  fontVariantNumeric: 'tabular-nums',
}
const rowNameWrapStyle: React.CSSProperties = { flex: '1 1 auto', minWidth: 0 }
const rowNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const rowSubStyle: React.CSSProperties = { fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }
const meTagStyle: React.CSSProperties = {
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '1px',
  padding: '2px 6px',
  borderRadius: 100,
  background: 'var(--color-bred)',
  color: '#fff',
  fontFamily: 'var(--font-mono)',
  flexShrink: 0,
}
const rowStatStyle: React.CSSProperties = { textAlign: 'right', flexShrink: 0 }
const rowStatValueStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-bred)',
}
const rowChevronStyle: React.CSSProperties = {
  fontSize: 24,
  color: 'var(--color-text-muted)',
  fontWeight: 300,
  lineHeight: 1,
  flexShrink: 0,
}

const emptyCardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '48px 24px',
  textAlign: 'center',
}
const emptyTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  margin: '0 0 8px',
  color: 'var(--color-text)',
}
const emptyTextStyle: React.CSSProperties = { fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }
