# ============================================================
#  Shooserie - Action #4 - Page /community
#  Liste verticale des collections publiques, tri alpha case-insensitive
#  Acces : utilisateurs authentifies uniquement (ProtectedRoute)
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

function Read-FileUtf8 {
    param([string]$Path)
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path (Get-Location).Path $Path }
    return [System.IO.File]::ReadAllText($full, [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "=== Shooserie - Action #4 - /community ===" -ForegroundColor Cyan
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
# 1. Ajout du hook usePublicProfiles dans publicProfileQueries.ts
# ============================================================
$queriesPath = "src/lib/publicProfileQueries.ts"
$queriesContent = Read-FileUtf8 $queriesPath

if ($queriesContent -match "usePublicProfiles") {
    Write-Host "  =  usePublicProfiles deja present, skip" -ForegroundColor DarkGray
} else {
    $newHook = @'


export type CommunityMember = {
  id: string
  display_name: string
  created_at: string
  sneakers_count: number
  for_sale_count: number
}

/**
 * Liste les profils publics (collection_public = true).
 * Pour chaque profil, agrege les compteurs total + for_sale via Promise.all
 * (N+1 queries, OK pour < 100 users ; au-dela passer en vue SQL).
 *
 * Tri alphabetique case-insensitive cote client (Postgres .order ne gere
 * pas lower() via PostgREST sans RPC).
 */
export function usePublicProfiles() {
  return useQuery({
    queryKey: ['community-profiles'],
    queryFn: async (): Promise<CommunityMember[]> => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, created_at')
        .eq('collection_public', true)

      if (error) throw error
      if (!profiles || profiles.length === 0) return []

      const enriched = await Promise.all(
        profiles
          .filter((p): p is { id: string; display_name: string; created_at: string } => !!p.display_name)
          .map(async (p) => {
            const [totalRes, forSaleRes] = await Promise.all([
              supabase
                .from('sneakers')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', p.id),
              supabase
                .from('sneakers')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', p.id)
                .eq('is_for_sale', true),
            ])
            return {
              id: p.id,
              display_name: p.display_name,
              created_at: p.created_at,
              sneakers_count: totalRes.count ?? 0,
              for_sale_count: forSaleRes.count ?? 0,
            } as CommunityMember
          }),
      )

      return enriched.sort((a, b) =>
        a.display_name.localeCompare(b.display_name, 'fr', {
          sensitivity: 'base',
        }),
      )
    },
    staleTime: 60_000,
  })
}
'@

    $queriesContent = $queriesContent.TrimEnd() + $newHook + "`n"
    Write-FileUtf8NoBom -Path $queriesPath -Content $queriesContent
    Write-Host "  +  usePublicProfiles + CommunityMember dans $queriesPath" -ForegroundColor Green
}

# ============================================================
# 2. Page src/pages/Community.tsx
# ============================================================
$pagePath = "src/pages/Community.tsx"
$pageContent = @'
/**
 * Community — page accessible aux utilisateurs authentifiés (/community).
 * Liste verticale des collections publiques, triée alpha (case-insensitive).
 * Chaque ligne renvoie vers /u/:display_name.
 */
import { Link } from 'react-router-dom'
import {
  usePublicProfiles,
  type CommunityMember,
} from '../lib/publicProfileQueries'

export default function Community() {
  const q = usePublicProfiles()

  // -------- Loading --------
  if (q.isLoading) {
    return (
      <div style={pageStyle}>
        <Header count={null} />
        <div style={listStyle}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ ...skeletonStyle, height: 76 }} />
          ))}
        </div>
      </div>
    )
  }

  // -------- Error --------
  if (q.isError) {
    return (
      <div style={pageStyle}>
        <Header count={null} />
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
      </div>
    )
  }

  const members = q.data ?? []

  return (
    <div style={pageStyle}>
      <Header count={members.length} />

      {members.length === 0 ? (
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
// Styles — cohérent avec UserProfile (Outfit, #0A0A0A, #CE1141)
// =================================================================

const FONT = "'Outfit', sans-serif"
const COLOR_TEXT = '#0A0A0A'
const COLOR_MUTED = '#6B7280'
const COLOR_RED = '#CE1141'
const COLOR_BORDER = '#E5E7EB'
const COLOR_BG_SOFT = '#F9FAFB'
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

// Silence l'avertissement "unused" si jamais cette constante n'est pas
// référencée par le bundler (elle reste utile pour cohérence des palettes).
void COLOR_RED
void COLOR_BG_SOFT
'@
Write-FileUtf8NoBom -Path $pagePath -Content $pageContent
Write-Host "  +  $pagePath" -ForegroundColor Green

# ============================================================
# 3. Patch src/App.tsx : import + route protegee
# ============================================================
$appPath = "src/App.tsx"
$appContent = Read-FileUtf8 $appPath

# --- Import ---
if ($appContent -match "from\s+['""]\.\/pages\/Community['""]") {
    Write-Host "  =  Import Community deja present dans App.tsx" -ForegroundColor DarkGray
} else {
    # Insere juste apres l'import UserProfile (existant et stable)
    $anchorImport = "import UserProfile from './pages/UserProfile'"
    $newImportLine = "import Community from './pages/Community'"
    if ($appContent.Contains($anchorImport)) {
        $appContent = $appContent.Replace(
            $anchorImport,
            $anchorImport + ";`r`n" + $newImportLine
        )
        # Nettoyage du double ';' eventuel si l'import existant avait deja un ;
        $appContent = $appContent -replace ';;', ';'
        Write-Host "  +  Import Community ajoute dans App.tsx" -ForegroundColor Green
    } else {
        Write-Host "WARN  Anchor import UserProfile introuvable, ajoute manuellement :" -ForegroundColor Yellow
        Write-Host "      $newImportLine" -ForegroundColor Yellow
    }
}

# --- Route protegee ---
if ($appContent -match '"/community"') {
    Write-Host "  =  Route /community deja presente dans App.tsx" -ForegroundColor DarkGray
} elseif ($appContent -match '<Route path="/u/:pseudo"') {
    # Insere juste AVANT la route /u/:pseudo (ordre quelconque mais grouper protected)
    $anchorRoute = '<Route path="/u/:pseudo" element={<UserProfile />} />'
    $newRouteBlock = @'
<Route
            path="/community"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route path="/u/:pseudo" element={<UserProfile />} />
'@
    if ($appContent.Contains($anchorRoute)) {
        $appContent = $appContent.Replace($anchorRoute, $newRouteBlock)
        Write-Host "  +  Route /community (protegee) ajoutee dans App.tsx" -ForegroundColor Green
    } else {
        Write-Host "WARN  Anchor route /u/:pseudo non trouve a l'identique, ajoute manuellement :" -ForegroundColor Yellow
        Write-Host '      <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />' -ForegroundColor Yellow
    }
} else {
    Write-Host "WARN  Aucune ancre route trouvee dans App.tsx" -ForegroundColor Yellow
}

Write-FileUtf8NoBom -Path $appPath -Content $appContent

# ============================================================
# Verif rapide
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Select-String -Path "src/lib/publicProfileQueries.ts" -Pattern "usePublicProfiles|CommunityMember" |
    ForEach-Object { "  $($_.Filename):$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path "src/App.tsx" -Pattern '"/community"|from .\/pages/Community' |
    ForEach-Object { "  $($_.Filename):$($_.LineNumber) : $($_.Line.Trim())" }

# Verif anti-double-encodage
$bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path "src/pages/Community.tsx"))
$utf8 = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($utf8 -match "Ã©|Ã¨|Ã |Ã€") {
    Write-Host "  ERREUR : double-encodage detecte dans Community.tsx" -ForegroundColor Red
} else {
    Write-Host "  OK : Community.tsx en UTF-8 propre" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Action #4 prete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes :" -ForegroundColor Yellow
Write-Host "  npm run build"
Write-Host "  git add src/lib/publicProfileQueries.ts src/pages/Community.tsx src/App.tsx"
Write-Host "  git commit -m `"feat(community): page /community (collections publiques, protected)`""
Write-Host "  git push origin dev"
Write-Host ""
Write-Host "Test apres Vercel :" -ForegroundColor Yellow
Write-Host "  https://shooserie-git-dev-gill-affoums-projects.vercel.app/community"
Write-Host "    -> doit lister Layon (97 paires), alexandrenolin_7, maximebadaut"
Write-Host "    -> clic sur Layon doit ouvrir /u/Layon"
Write-Host ""
