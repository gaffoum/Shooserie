/**
 * UserProfile — profil public MINIMAL (/u/:pseudo). Vague 2.
 *
 * 🔒 Confidentialité : on n'affiche QUE pseudo + display_name + avatar +
 * écusson de rang + total ⭐ + nombre de paires (COUNT). AUCUNE donnée sensible
 * (prix, email, code parrainage) ni le détail de la collection. La requête
 * (useUserProfileByPseudo) ne charge que ces colonnes et gate sur
 * `pseudo_configured` → 404 propre si introuvable / non publiable.
 */
import type { CSSProperties } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { useUserProfileByPseudo } from '../lib/publicProfileQueries'
import { getRankDisplay } from '../lib/ranks'
import { useTheme } from '../contexts/ThemeContext'
import { useT, localeFor } from '@/i18n/I18nContext'

export default function UserProfile() {
  const { pseudo } = useParams<{ pseudo: string }>()
  const { lang } = useT()
  const { resolved } = useTheme()
  const q = useUserProfileByPseudo(pseudo)
  const profile = q.data

  if (q.isLoading) {
    return (
      <Shell>
        <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />
      </Shell>
    )
  }

  if (q.isError) {
    return (
      <Shell center>
        <h1 style={titleStyle}>Erreur de chargement</h1>
        <p style={mutedStyle}>Impossible de récupérer le profil. Réessaie dans un instant.</p>
      </Shell>
    )
  }

  // 404 : introuvable ou pseudo non configuré (géré côté requête).
  if (!profile) {
    return (
      <Shell center>
        <h1 style={titleStyle}>Utilisateur introuvable</h1>
        <p style={{ ...mutedStyle, marginBottom: 24 }}>
          Aucun profil public ne porte le pseudo «&nbsp;{pseudo}&nbsp;».
        </p>
        <Link to="/" style={primaryBtnStyle}>Retour à l'accueil</Link>
      </Shell>
    )
  }

  const rank = getRankDisplay(profile.rank)
  const icon = resolved === 'dark' ? rank.iconDark : rank.iconLight
  const fmt = (n: number) => n.toLocaleString(localeFor(lang))
  const name = profile.display_name || profile.username || '—'
  const initial = name.charAt(0).toUpperCase()

  return (
    <Shell>
      <div style={cardStyle}>
        {/* Cover dégradé Bred→Royal */}
        <div style={coverStyle} aria-hidden />

        <div style={cardBodyStyle}>
          {/* Avatar */}
          <div style={avatarWrapStyle}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={avatarImgStyle} />
            ) : (
              <div style={avatarFallbackStyle} aria-hidden>{initial}</div>
            )}
          </div>

          <h1 style={nameStyle}>{name}</h1>
          {profile.username && profile.username !== profile.display_name && (
            <div className="lab" style={handleStyle}>@{profile.username}</div>
          )}

          {/* Rang */}
          <div style={rankRowStyle}>
            <img
              src={icon}
              alt=""
              aria-hidden
              width={26}
              height={26}
              style={{ objectFit: 'contain' }}
              onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
            />
            <span style={rankLabelStyle}>{rank.label}</span>
          </div>

          {/* Stats minimales : étoiles + paires */}
          <div style={statsStyle}>
            <div style={statStyle}>
              <div style={statValueStyle}>⭐ {fmt(profile.stars_total)}</div>
              <div className="lab" style={statLabelStyle}>ÉTOILES</div>
            </div>
            <div style={statDividerStyle} aria-hidden />
            <div style={statStyle}>
              <div style={statValueStyle}>{fmt(profile.pairs_count)}</div>
              <div className="lab" style={statLabelStyle}>PAIRES</div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}

function Shell({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={{ ...pageStyle, ...(center ? { textAlign: 'center' as const } : null) }}>
        {children}
      </div>
    </>
  )
}

// =================================================================
// Styles
// =================================================================
const pageStyle: CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '24px 16px',
  fontFamily: 'var(--font-display)',
  color: 'var(--color-text)',
}
const titleStyle: CSSProperties = { fontSize: 24, fontWeight: 800, margin: '0 0 8px', color: 'var(--color-text)' }
const mutedStyle: CSSProperties = { fontSize: 14, color: 'var(--color-text-muted)', margin: 0 }
const primaryBtnStyle: CSSProperties = {
  display: 'inline-block',
  padding: '10px 18px',
  background: 'var(--color-bred)',
  color: '#fff',
  borderRadius: 'var(--radius-md)',
  fontWeight: 700,
  fontSize: 14,
  textDecoration: 'none',
}

const cardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  overflow: 'hidden',
}
const coverStyle: CSSProperties = {
  height: 96,
  background: 'linear-gradient(120deg, rgba(206,17,65,0.55), rgba(29,66,138,0.45))',
}
const cardBodyStyle: CSSProperties = {
  padding: '0 20px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
}
const avatarWrapStyle: CSSProperties = { marginTop: -44 }
const avatarImgStyle: CSSProperties = {
  width: 88,
  height: 88,
  borderRadius: '50%',
  objectFit: 'cover',
  border: '4px solid var(--color-surface)',
  background: 'var(--color-surface-alt)',
}
const avatarFallbackStyle: CSSProperties = {
  width: 88,
  height: 88,
  borderRadius: '50%',
  border: '4px solid var(--color-surface)',
  background: 'var(--color-bred)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 34,
  fontWeight: 800,
}
const nameStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: '-0.4px',
  margin: '12px 0 0',
  color: 'var(--color-text)',
}
const handleStyle: CSSProperties = { fontSize: 11, letterSpacing: '1px', color: 'var(--color-text-muted)', marginTop: 2 }
const rankRowStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 12,
  padding: '6px 14px',
  borderRadius: 100,
  background: 'var(--color-surface-alt)',
  border: '1px solid var(--color-border)',
}
const rankLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-text)',
}
const statsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  marginTop: 20,
}
const statStyle: CSSProperties = { textAlign: 'center' }
const statValueStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: '-0.6px',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-text)',
}
const statLabelStyle: CSSProperties = { fontSize: 9, letterSpacing: '1.5px', color: 'var(--color-text-muted)', marginTop: 4 }
const statDividerStyle: CSSProperties = { width: 1, height: 32, background: 'var(--color-border)' }
