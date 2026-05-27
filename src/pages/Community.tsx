/**
 * Community — page accessible aux utilisateurs authentifiés (/community).
 * Liste verticale des collections publiques, triée alpha case-insensitive.
 * Chaque ligne renvoie vers /u/:display_name.
 */
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import {
  usePublicProfiles,
  type CommunityMember,
} from '../lib/publicProfileQueries'

export default function Community() {
  const q = usePublicProfiles()
  const members = q.data ?? []
  const count = q.isLoading || q.isError ? null : members.length

  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={pageStyle}>
        <Header count={count} />
        {q.isLoading ? (
          <div style={listStyle}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ ...skeletonStyle, height: 76 }} />
            ))}
          </div>
        ) : q.isError ? (
          <div style={emptyCardStyle}>
            <h2 style={emptyTitleStyle}>Erreur de chargement</h2>
            <p style={emptyTextStyle}>
              Impossible de récupérer la communauté. Réessaie dans un instant.
            </p>
            <p
              style={{
                ...emptyTextStyle,
                marginTop: 8,
                fontSize: 12,
                fontFamily: 'monospace',
              }}
            >
              {(q.error as Error)?.message ?? 'Erreur inconnue'}
            </p>
          </div>
        ) : members.length === 0 ? (
          <div style={emptyCardStyle}>
            <h2 style={emptyTitleStyle}>Aucune collection publique</h2>
            <p style={emptyTextStyle}>
              Personne n'a encore rendu sa collection publique. Sois le premier
              depuis ton profil&nbsp;!
            </p>
          </div>
        ) : (
          <div style={listStyle}>
            {members.map((m) => (
              <CommunityRow key={m.id} member={m} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// =================================================================
// Sub-components
// =================================================================

function Header({ count }: { count: number | null }) {
  return (
    <div style={headerStyle}>
      <h1 style={pageTitleStyle}>Communauté</h1>
      <p style={subtitleStyle}>
        {count === null
          ? 'Découvre les collections publiques de Shooserie.'
          : count === 0
            ? 'Aucune collection publique pour le moment.'
            : count === 1
              ? '1 collection publique à découvrir.'
              : `${count} collections publiques à découvrir.`}
      </p>
    </div>
  )
}

function CommunityRow({ member }: { member: CommunityMember }) {
  return (
    <Link to={`/u/${encodeURIComponent(member.display_name)}`} style={rowStyle}>
      <div style={rowLeftStyle}>
        <div style={rowPseudoStyle}>{member.display_name}</div>
        <div style={rowDateStyle}>
          Membre depuis le{' '}
          {new Date(member.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </div>
      <div style={rowStatsStyle}>
        <div style={rowStatStyle}>
          <div style={rowStatValueStyle}>{member.sneakers_count}</div>
          <div style={rowStatLabelStyle}>paires</div>
        </div>
        <div style={rowStatStyle}>
          <div style={rowStatValueStyle}>{member.for_sale_count}</div>
          <div style={rowStatLabelStyle}>en vente</div>
        </div>
        <div style={rowChevronStyle} aria-hidden>
          ›
        </div>
      </div>
    </Link>
  )
}

// =================================================================
// Styles
// =================================================================

const FONT = "'Outfit', sans-serif"
const COLOR_TEXT = '#0A0A0A'
const COLOR_MUTED = '#6B7280'
const COLOR_BORDER = '#E5E7EB'
const COLOR_CARD = '#FFFFFF'

const pageStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '32px 24px',
  fontFamily: FONT,
  color: COLOR_TEXT,
}

const headerStyle: React.CSSProperties = {
  marginBottom: 32,
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: '0 0 8px',
  color: COLOR_TEXT,
}

const subtitleStyle: React.CSSProperties = {
  fontSize: 16,
  color: COLOR_MUTED,
  margin: 0,
}

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  background: COLOR_CARD,
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: 12,
  padding: '16px 20px',
  textDecoration: 'none',
  color: COLOR_TEXT,
  fontFamily: FONT,
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
}

const rowLeftStyle: React.CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
}

const rowPseudoStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: COLOR_TEXT,
  marginBottom: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const rowDateStyle: React.CSSProperties = {
  fontSize: 13,
  color: COLOR_MUTED,
}

const rowStatsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  flexShrink: 0,
}

const rowStatStyle: React.CSSProperties = {
  textAlign: 'center',
  minWidth: 52,
}

const rowStatValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: COLOR_TEXT,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.1,
}

const rowStatLabelStyle: React.CSSProperties = {
  fontSize: 10,
  color: COLOR_MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginTop: 2,
}

const rowChevronStyle: React.CSSProperties = {
  fontSize: 28,
  color: COLOR_MUTED,
  fontWeight: 300,
  lineHeight: 1,
  marginLeft: 4,
}

const emptyCardStyle: React.CSSProperties = {
  background: COLOR_CARD,
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: 12,
  padding: '48px 24px',
  textAlign: 'center',
}

const emptyTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  margin: '0 0 8px',
  color: COLOR_TEXT,
}

const emptyTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: COLOR_MUTED,
  margin: 0,
}

const skeletonStyle: React.CSSProperties = {
  background:
    'linear-gradient(90deg, #F3F4F6 0%, #E5E7EB 50%, #F3F4F6 100%)',
  borderRadius: 12,
  width: '100%',
}