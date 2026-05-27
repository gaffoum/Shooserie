# ============================================================
#  Shooserie - Action #3 - CORRECTIF
#  Stack reelle : Vite + React + TS + Supabase (pas de UI lib)
#  Branche cible : dev
# ============================================================
#  A lancer depuis la racine du repo :
#    powershell -ExecutionPolicy Bypass -File .\shooserie-action-3-fix.ps1
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path (Get-Location).Path $Path }
    [System.IO.File]::WriteAllText($full, $Content, (New-Object System.Text.UTF8Encoding $false))
}

Write-Host ""
Write-Host "=== Shooserie - Action #3 (correctif build) ===" -ForegroundColor Cyan
$currentBranch = ""
try { $currentBranch = (git branch --show-current 2>$null).Trim() } catch {}
Write-Host "Branche actuelle : $currentBranch"
if ($currentBranch -ne "dev") {
    Write-Host "WARN  Tu n'es pas sur 'dev' (actuelle: '$currentBranch')" -ForegroundColor Red
    $confirm = Read-Host "Continuer quand meme ? (o/N)"
    if ($confirm -ne "o" -and $confirm -ne "O") { exit 0 }
}
Write-Host ""

# ============================================================
# 1. Nettoyage : suppression du dossier hooks/ casse
# ============================================================
if (Test-Path "src/hooks") {
    Remove-Item -Recurse -Force "src/hooks"
    Write-Host "  -  src/hooks/  (supprime, les hooks vont dans src/lib/)" -ForegroundColor Yellow
}

# ============================================================
# 2. src/lib/publicProfileQueries.ts   (les 2 hooks)
# ============================================================
$queriesFile = @'
import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export type PublicProfile = {
  id: string
  display_name: string
  created_at: string
  is_public: boolean | null
  /** null si la collection est privée (compteur réel non accessible via RLS). */
  sneakers_count: number | null
  for_sale_count: number
}

export type UserSneaker = {
  id: string
  user_id: string
  brand: string | null
  model: string | null
  image_url: string | null
  is_for_sale: boolean | null
  price: number | null
  size: string | null
  created_at: string
}

/**
 * Récupère un profil public à partir du pseudo (display_name, case-insensitive).
 * Retourne null si aucun utilisateur ne porte ce pseudo.
 *
 * Note RLS :
 *   - is_public = true  -> count('sneakers') renvoie le total réel
 *   - is_public = false -> count ne renverrait que les paires visibles
 *     (is_for_sale=true), ce qui serait trompeur => on force null.
 *
 * Pré-requis schema : la colonne `is_public` doit exister sur `profiles`.
 * Si elle n'existe pas encore :
 *   ALTER TABLE profiles ADD COLUMN is_public boolean NOT NULL DEFAULT true;
 */
export function useUserProfileByPseudo(pseudo: string | undefined) {
  return useQuery({
    queryKey: ['public-profile', pseudo?.toLowerCase()],
    enabled: !!pseudo,
    queryFn: async (): Promise<PublicProfile | null> => {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, display_name, created_at, is_public')
        .ilike('display_name', pseudo!)
        .maybeSingle()

      if (error) throw error
      if (!profile) return null

      const [totalRes, forSaleRes] = await Promise.all([
        supabase
          .from('sneakers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id),
        supabase
          .from('sneakers')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('is_for_sale', true),
      ])

      const isPrivate = profile.is_public === false

      return {
        id: profile.id,
        display_name: profile.display_name,
        created_at: profile.created_at,
        is_public: profile.is_public ?? null,
        sneakers_count: isPrivate ? null : (totalRes.count ?? 0),
        for_sale_count: forSaleRes.count ?? 0,
      }
    },
    staleTime: 60_000,
  })
}

/**
 * Liste les sneakers d'un utilisateur cible.
 * La RLS filtre automatiquement :
 *   - collection publique  -> toutes les paires
 *   - collection privée    -> uniquement is_for_sale = true
 */
export function useUserSneakers(
  userId: string | undefined,
  onlyForSale = false,
) {
  return useQuery({
    queryKey: ['user-sneakers', userId, onlyForSale],
    enabled: !!userId,
    queryFn: async (): Promise<UserSneaker[]> => {
      let q = supabase
        .from('sneakers')
        .select(
          'id, user_id, brand, model, image_url, is_for_sale, price, size, created_at',
        )
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })

      if (onlyForSale) q = q.eq('is_for_sale', true)

      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as UserSneaker[]
    },
    staleTime: 30_000,
  })
}
'@
Write-FileUtf8NoBom -Path "src/lib/publicProfileQueries.ts" -Content $queriesFile
Write-Host "  +  src/lib/publicProfileQueries.ts" -ForegroundColor Green

# ============================================================
# 3. src/pages/UserProfile.tsx   (styles inline, zero dep UI)
# ============================================================
$pageFile = @'
/**
 * UserProfile — page publique d'un utilisateur (/u/:pseudo).
 * Pas de dépendance UI externe : styles inline, fonte Outfit, accent #CE1141.
 * Cohérent avec WelcomeHeader.tsx.
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
          Aucun utilisateur ne porte le pseudo «&nbsp;{pseudo}&nbsp;».
        </p>
        <Link to="/" style={primaryButtonStyle}>
          Retour à l'accueil
        </Link>
      </div>
    )
  }

  const isPrivate = profile.is_public === false

  // -------- Render --------
  return (
    <div style={pageStyle}>
      {/* === Header === */}
      <div style={headerCardStyle}>
        <div style={headerLeftStyle}>
          <div style={pseudoRowStyle}>
            <h1 style={pseudoTitleStyle}>{profile.display_name}</h1>
            {isPrivate && (
              <span style={privateBadgeStyle}>Collection privée</span>
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

      {/* === Contrôles : onglets + filtres === */}
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
              : 'Aucune paire à afficher.'
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
      <h2 style={emptyTitleStyle}>Collection privée</h2>
      <p style={emptyTextStyle}>
        Cet utilisateur a choisi de garder sa collection privée.
      </p>
      <p style={{ ...emptyTextStyle, marginTop: 8, fontSize: 13 }}>
        Vous pouvez tout de même consulter ses paires en vente via l'onglet
        «&nbsp;En vente&nbsp;».
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
          <div style={cardImagePlaceholderStyle}>—</div>
        )}
      </div>
      <div style={cardBodyStyle}>
        <div style={cardBrandStyle}>{s.brand ?? '—'}</div>
        <div style={cardModelStyle}>{s.model ?? ''}</div>
        {s.is_for_sale && (
          <div style={cardSaleRowStyle}>
            <span style={saleBadgeStyle}>À vendre</span>
            {s.price != null && (
              <span style={cardPriceStyle}>{s.price}&nbsp;€</span>
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
          <div style={cardImagePlaceholderStyle}>—</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={listTitleStyle}>
          {[s.brand, s.model].filter(Boolean).join(' · ') || '—'}
        </div>
        {s.size && <div style={listSubtitleStyle}>Taille {s.size}</div>}
      </div>
      {s.is_for_sale && (
        <div style={{ textAlign: 'right' }}>
          <span style={saleBadgeStyle}>À vendre</span>
          {s.price != null && (
            <div style={{ ...cardPriceStyle, marginTop: 4 }}>
              {s.price}&nbsp;€
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =================================================================
// Styles — cohérent avec WelcomeHeader (Outfit / #0A0A0A / #CE1141)
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
'@
Write-FileUtf8NoBom -Path "src/pages/UserProfile.tsx" -Content $pageFile
Write-Host "  ~  src/pages/UserProfile.tsx  (reecrit : styles inline, zero dep)" -ForegroundColor Green

# ============================================================
# 4. Patch App.tsx : import "@/pages/UserProfile" -> relatif
# ============================================================
$appPath = "src/App.tsx"
if (Test-Path $appPath) {
    $appContent = Get-Content $appPath -Raw
    $original = $appContent

    # Variantes possibles de l'import alias
    $variants = @(
        "'@/pages/UserProfile'",
        '"@/pages/UserProfile"'
    )
    $replaced = $false
    foreach ($v in $variants) {
        if ($appContent.Contains($v)) {
            $appContent = $appContent.Replace($v, "'./pages/UserProfile'")
            $replaced = $true
        }
    }

    if ($replaced) {
        Write-FileUtf8NoBom -Path $appPath -Content $appContent
        Write-Host "  ~  src/App.tsx  (import alias -> chemin relatif)" -ForegroundColor Green
    } elseif ($appContent -match "from\s+['""]\.\/pages\/UserProfile['""]") {
        Write-Host "  =  src/App.tsx  (import deja relatif)" -ForegroundColor DarkGray
    } else {
        Write-Host "WARN  src/App.tsx : aucun import UserProfile detecte." -ForegroundColor Yellow
        Write-Host "      Ajoute manuellement :" -ForegroundColor Yellow
        Write-Host "        import UserProfile from './pages/UserProfile'" -ForegroundColor Yellow
        Write-Host '        <Route path="/u/:pseudo" element={<UserProfile />} />' -ForegroundColor Yellow
    }
} else {
    Write-Host "WARN  src/App.tsx introuvable." -ForegroundColor Yellow
}

# ============================================================
# Recap
# ============================================================
Write-Host ""
Write-Host "=== Correctif applique ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Etat des fichiers :" -ForegroundColor White
Write-Host "  - src/hooks/                          [supprime]"
Write-Host "  - src/lib/publicProfileQueries.ts     [cree]"
Write-Host "  - src/pages/UserProfile.tsx           [reecrit]"
Write-Host "  - src/App.tsx                         [import patche]"
Write-Host ""
Write-Host "Pre-requis schema a verifier :" -ForegroundColor Yellow
Write-Host "  La table 'profiles' doit avoir une colonne 'is_public' (boolean)."
Write-Host "  Sinon, dans Supabase SQL editor :"
Write-Host "    ALTER TABLE profiles ADD COLUMN is_public boolean NOT NULL DEFAULT true;"
Write-Host ""
Write-Host "Verif locale (optionnel mais recommande, evite un build Vercel cassse) :" -ForegroundColor Yellow
Write-Host "  npx tsc -b --noEmit"
Write-Host ""
Write-Host "Commandes git :" -ForegroundColor Cyan
Write-Host "  git branch                            # confirmer  * dev"
Write-Host "  git status"
Write-Host "  git add src/lib/publicProfileQueries.ts src/pages/UserProfile.tsx src/App.tsx"
Write-Host "  git rm -r --cached src/hooks 2>$null  # si jamais le dossier avait ete trackee"
Write-Host "  git commit -m `"fix(profile): retire shadcn/lucide, styles inline coherents avec WelcomeHeader`""
Write-Host "  git push origin dev"
Write-Host ""
Write-Host "Test apres deploy Vercel :" -ForegroundColor Cyan
Write-Host "  https://shooserie-git-dev-gill-affoums-projects.vercel.app/u/gaffoum"
Write-Host "  https://shooserie-git-dev-gill-affoums-projects.vercel.app/u/Titi"
Write-Host "  https://shooserie-git-dev-gill-affoums-projects.vercel.app/u/inexistant"
Write-Host ""
