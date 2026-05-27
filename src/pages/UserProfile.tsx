/**
 * UserProfile â€” page publique d'un utilisateur (/u/:pseudo).
 * Pas de dÃ©pendance UI externe : styles inline, fonte Outfit, accent #CE1141.
 * CohÃ©rent avec WelcomeHeader.tsx.
 */
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  useUserProfileByPseudo,
  useUserSneakers,
  type UserSneaker,
} from '../lib/publicProfileQueries'

type ViewMode = 'grid' | 'list'
type TabKey = 'all' | 'for-sale'

export default function UserProfile() {
  const { pseudo } = useParams<{ pseudo: string }>()
  const profileQ = useUserProfileByPseudo(pseudo)
  const profile = profileQ.data

  const [tab, setTab] = useState<TabKey>('all')
  const [view, setView] = useState<ViewMode>('grid')
  const [brandFilter, setBrandFilter] = useState<string>('all')

  const sneakersQ = useUserSneakers(profile?.id, tab === 'for-sale')
  const sneakers = sneakersQ.data ?? []

  const brands = useMemo(() => {
    const set = new Set<string>()
    for (const s of sneakers) if (s.brand) set.add(s.brand)
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [sneakers])

  const filtered = useMemo(() => {
    if (brandFilter === 'all') return sneakers
    return sneakers.filter((s) => s.brand === brandFilter)
  }, [sneakers, brandFilter])

  // -------- Loading --------
  if (profileQ.isLoading) {
    return (
      <div style={pageStyle}>
        <div style={{ ...skeletonStyle, height: 140, marginBottom: 24 }} />
        <div style={{ ...skeletonStyle, height: 320 }} />
      </div>
    )
  }

  // -------- 404 --------
  if (!profile) {
    return (
      <div style={{ ...pageStyle, textAlign: 'center' }}>
        <h1 style={pageTitleStyle}>Utilisateur introuvable</h1>
        <p style={{ ...mutedTextStyle, marginBottom: 24 }}>
          Aucun utilisateur ne porte le pseudo Â«&nbsp;{pseudo}&nbsp;Â».
        </p>
        <Link to="/" style={primaryButtonStyle}>
          Retour Ã  l'accueil
        </Link>
      </div>
    )
  }

  const isPrivate = profile.collection_public === false

  // -------- Render --------
  return (
    <div style={pageStyle}>
      {/* === Header === */}
      <div style={headerCardStyle}>
        <div style={headerLeftStyle}>
          <div style={pseudoRowStyle}>
            <h1 style={pseudoTitleStyle}>{profile.display_name}</h1>
            {isPrivate && (
              <span style={privateBadgeStyle}>Collection privÃ©e</span>
            )}
          </div>
          <p style={memberSinceStyle}>
            Membre depuis le{' '}
            {new Date(profile.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div style={statsRowStyle}>
          {profile.sneakers_count !== null && (
            <Stat value={profile.sneakers_count} label="paires" />
          )}
          <Stat value={profile.for_sale_count} label="en vente" />
        </div>
      </div>

      {/* === ContrÃ´les : onglets + filtres === */}
      <div style={controlsRowStyle}>
        <div style={tabBarStyle}>
          <button
            type="button"
            onClick={() => setTab('all')}
            style={tab === 'all' ? activeTabStyle : inactiveTabStyle}
          >
            Toutes
          </button>
          <button
            type="button"
            onClick={() => setTab('for-sale')}
            style={tab === 'for-sale' ? activeTabStyle : inactiveTabStyle}
          >
            En vente
          </button>
        </div>

        <div style={filtersStyle}>
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            style={selectStyle}
            aria-label="Filtrer par marque"
          >
            <option value="all">Toutes les marques</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          <div style={viewToggleStyle}>
            <button
              type="button"
              onClick={() => setView('grid')}
              style={view === 'grid' ? activeViewBtnStyle : viewBtnStyle}
              aria-label="Vue grille"
            >
              Grille
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              style={view === 'list' ? activeViewBtnStyle : viewBtnStyle}
              aria-label="Vue liste"
            >
              Liste
            </button>
          </div>
        </div>
      </div>

      {/* === Contenu === */}
      {tab === 'all' && isPrivate ? (
        <PrivateCollection />
      ) : sneakersQ.isLoading ? (
        <LoadingGrid view={view} />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={
            tab === 'for-sale'
              ? 'Aucune paire en vente actuellement.'
              : 'Aucune paire Ã  afficher.'
          }
        />
      ) : (
        <SneakerListing sneakers={filtered} view={view} />
      )}
    </div>
  )
}

// =================================================================
// Sub-components
// =================================================================

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div style={statBoxStyle}>
      <div style={statValueStyle}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  )
}

function PrivateCollection() {
  return (
    <div style={emptyCardStyle}>
      <h2 style={emptyTitleStyle}>Collection privÃ©e</h2>
      <p style={emptyTextStyle}>
        Cet utilisateur a choisi de garder sa collection privÃ©e.
      </p>
      <p style={{ ...emptyTextStyle, marginTop: 8, fontSize: 13 }}>
        Vous pouvez tout de mÃªme consulter ses paires en vente via l'onglet
        Â«&nbsp;En vente&nbsp;Â».
      </p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={emptyCardStyle}>
      <p style={emptyTextStyle}>{message}</p>
    </div>
  )
}

function LoadingGrid({ view }: { view: ViewMode }) {
  if (view === 'grid') {
    return (
      <div style={sneakerGridStyle}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ ...skeletonStyle, aspectRatio: '1 / 1' }} />
        ))}
      </div>
    )
  }
  return (
    <div style={sneakerListStyle}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ ...skeletonStyle, height: 80 }} />
      ))}
    </div>
  )
}

function SneakerListing({
  sneakers,
  view,
}: {
  sneakers: UserSneaker[]
  view: ViewMode
}) {
  if (view === 'grid') {
    return (
      <div style={sneakerGridStyle}>
        {sneakers.map((s) => (
          <SneakerCardGrid key={s.id} sneaker={s} />
        ))}
      </div>
    )
  }
  return (
    <div style={sneakerListStyle}>
      {sneakers.map((s) => (
        <SneakerCardList key={s.id} sneaker={s} />
      ))}
    </div>
  )
}

function SneakerCardGrid({ sneaker: s }: { sneaker: UserSneaker }) {
  return (
    <div style={cardStyle}>
      <div style={cardImageWrapStyle}>
        {s.image_url ? (
          <img
            src={s.image_url}
            alt={[s.brand, s.model].filter(Boolean).join(' ')}
            style={cardImageStyle}
            loading="lazy"
          />
        ) : (
          <div style={cardImagePlaceholderStyle}>â€”</div>
        )}
      </div>
      <div style={cardBodyStyle}>
        <div style={cardBrandStyle}>{s.brand ?? 'â€”'}</div>
        <div style={cardModelStyle}>{s.model ?? ''}</div>
        {s.is_for_sale && (
          <div style={cardSaleRowStyle}>
            <span style={saleBadgeStyle}>Ã€ vendre</span>
            {s.price != null && (
              <span style={cardPriceStyle}>{s.price}&nbsp;â‚¬</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SneakerCardList({ sneaker: s }: { sneaker: UserSneaker }) {
  return (
    <div style={listCardStyle}>
      <div style={listImageWrapStyle}>
        {s.image_url ? (
          <img src={s.image_url} alt="" style={cardImageStyle} loading="lazy" />
        ) : (
          <div style={cardImagePlaceholderStyle}>â€”</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={listTitleStyle}>
          {[s.brand, s.model].filter(Boolean).join(' Â· ') || 'â€”'}
        </div>
        {s.size && <div style={listSubtitleStyle}>Taille {s.size}</div>}
      </div>
      {s.is_for_sale && (
        <div style={{ textAlign: 'right' }}>
          <span style={saleBadgeStyle}>Ã€ vendre</span>
          {s.price != null && (
            <div style={{ ...cardPriceStyle, marginTop: 4 }}>
              {s.price}&nbsp;â‚¬
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =================================================================
// Styles â€” cohÃ©rent avec WelcomeHeader (Outfit / #0A0A0A / #CE1141)
// =================================================================

const FONT = "'Outfit', sans-serif"
const COLOR_TEXT = '#0A0A0A'
const COLOR_MUTED = '#6B7280'
const COLOR_RED = '#CE1141'
const COLOR_BORDER = '#E5E7EB'
const COLOR_BG_SOFT = '#F9FAFB'
const COLOR_CARD = '#FFFFFF'

const pageStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '32px 24px',
  fontFamily: FONT,
  color: COLOR_TEXT,
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: '0 0 8px',
}

const headerCardStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 24,
  flexWrap: 'wrap',
  background: COLOR_CARD,
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: 12,
  padding: 24,
  marginBottom: 24,
}

const headerLeftStyle: React.CSSProperties = {
  flex: '1 1 auto',
  minWidth: 0,
}

const pseudoRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 8,
}

const pseudoTitleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  margin: 0,
  color: COLOR_TEXT,
}

const privateBadgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  background: COLOR_BG_SOFT,
  color: COLOR_MUTED,
  padding: '4px 10px',
  borderRadius: 999,
  border: `1px solid ${COLOR_BORDER}`,
}

const memberSinceStyle: React.CSSProperties = {
  fontSize: 14,
  color: COLOR_MUTED,
  margin: 0,
}

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 24,
}

const statBoxStyle: React.CSSProperties = {
  textAlign: 'center',
  minWidth: 60,
}

const statValueStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: COLOR_TEXT,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.1,
}

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: COLOR_MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginTop: 2,
}

const mutedTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: COLOR_MUTED,
}

const controlsRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 16,
  borderBottom: `1px solid ${COLOR_BORDER}`,
  paddingBottom: 12,
}

const tabBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
}

const baseTabStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: '8px 16px',
  fontSize: 15,
  cursor: 'pointer',
  fontFamily: FONT,
  borderRadius: 6,
  transition: 'background 120ms ease',
}

const inactiveTabStyle: React.CSSProperties = {
  ...baseTabStyle,
  color: COLOR_MUTED,
  fontWeight: 500,
}

const activeTabStyle: React.CSSProperties = {
  ...baseTabStyle,
  color: COLOR_TEXT,
  background: COLOR_BG_SOFT,
  fontWeight: 600,
  boxShadow: `inset 0 -2px 0 ${COLOR_RED}`,
}

const filtersStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  flexWrap: 'wrap',
}

const selectStyle: React.CSSProperties = {
  height: 36,
  padding: '0 12px',
  borderRadius: 8,
  border: `1px solid ${COLOR_BORDER}`,
  background: COLOR_CARD,
  fontFamily: FONT,
  fontSize: 14,
  color: COLOR_TEXT,
  cursor: 'pointer',
}

const viewToggleStyle: React.CSSProperties = {
  display: 'flex',
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: 8,
  overflow: 'hidden',
}

const baseViewBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: '8px 14px',
  fontSize: 13,
  fontFamily: FONT,
  cursor: 'pointer',
  fontWeight: 500,
}

const viewBtnStyle: React.CSSProperties = {
  ...baseViewBtnStyle,
  color: COLOR_MUTED,
}

const activeViewBtnStyle: React.CSSProperties = {
  ...baseViewBtnStyle,
  background: COLOR_TEXT,
  color: '#FFFFFF',
}

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  background: COLOR_RED,
  color: '#FFFFFF',
  padding: '10px 20px',
  borderRadius: 8,
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: 14,
  fontFamily: FONT,
}

const sneakerGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 16,
}

const sneakerListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const cardStyle: React.CSSProperties = {
  background: COLOR_CARD,
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: 10,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

const cardImageWrapStyle: React.CSSProperties = {
  aspectRatio: '1 / 1',
  background: COLOR_BG_SOFT,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const cardImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

const cardImagePlaceholderStyle: React.CSSProperties = {
  color: COLOR_MUTED,
  fontSize: 24,
}

const cardBodyStyle: React.CSSProperties = {
  padding: 12,
}

const cardBrandStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 14,
  color: COLOR_TEXT,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const cardModelStyle: React.CSSProperties = {
  fontSize: 13,
  color: COLOR_MUTED,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  marginTop: 2,
}

const cardSaleRowStyle: React.CSSProperties = {
  marginTop: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}

const saleBadgeStyle: React.CSSProperties = {
  background: COLOR_RED,
  color: '#FFFFFF',
  fontSize: 11,
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: 999,
  letterSpacing: '0.02em',
}

const cardPriceStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 14,
  color: COLOR_TEXT,
  fontVariantNumeric: 'tabular-nums',
}

const listCardStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  background: COLOR_CARD,
  border: `1px solid ${COLOR_BORDER}`,
  borderRadius: 10,
  padding: 12,
}

const listImageWrapStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  flexShrink: 0,
  background: COLOR_BG_SOFT,
  borderRadius: 8,
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const listTitleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 15,
  color: COLOR_TEXT,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const listSubtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: COLOR_MUTED,
  marginTop: 2,
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
  borderRadius: 10,
  width: '100%',
}