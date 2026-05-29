# ============================================================
#  Shooserie - Wear Tracking Phase 2B
#   1. wears.ts : ajoute useMyTopWornSneakers (resoud l'user auto)
#   2. Cree src/components/TopWornSneakers.tsx
#   3. Dashboard : insere <TopWornSneakers limit={10} /> apres TopOwnedModels
#   4. SneakerCard : ajoute badge statut bottom-left + bouton +1 bottom-right
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path (Get-Location).Path $Path }
    [System.IO.File]::WriteAllText($full, $Content, (New-Object System.Text.UTF8Encoding $false))
}
function Read-FileUtf8 {
    param([string]$Path)
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path (Get-Location).Path $Path }
    return [System.IO.File]::ReadAllText($full, [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "=== Wear Tracking Phase 2B ===" -ForegroundColor Cyan
$currentBranch = ""
try { $currentBranch = (git branch --show-current 2>$null).Trim() } catch {}
Write-Host "Branche actuelle : $currentBranch"
if ($currentBranch -ne "dev") {
    Write-Host "WARN  Pas sur 'dev'" -ForegroundColor Red
    $c = Read-Host "Continuer ? (o/N)"
    if ($c -ne "o" -and $c -ne "O") { exit 0 }
}
Write-Host ""

# ============================================================
# 1. wears.ts : ajoute useMyTopWornSneakers (wrapper qui resoud l'user)
# ============================================================
$wearsPath = "src/lib/wears.ts"
$wears = Read-FileUtf8 $wearsPath

if ($wears -match "useMyTopWornSneakers") {
    Write-Host "  =  useMyTopWornSneakers deja present" -ForegroundColor DarkGray
} else {
    $hookAdd = @'


// =============================================================
// Top N portees de l'utilisateur courant.
// Wrapper qui resoud l'auth user via supabase.auth puis delegue
// a useTopWornSneakers. Utilise par <TopWornSneakers /> sur le dashboard.
// =============================================================

export function useMyTopWornSneakers(limit = 10) {
  const { data: userId } = useQuery({
    queryKey: ['auth-user-id'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user?.id ?? null
    },
    staleTime: 5 * 60 * 1000, // 5 min : l'identite ne change pas souvent
  })
  return useTopWornSneakers(userId ?? undefined, limit)
}
'@
    $wears = $wears.TrimEnd() + $hookAdd + "`r`n"
    Write-FileUtf8NoBom -Path $wearsPath -Content $wears
    Write-Host "  +  useMyTopWornSneakers ajoute a wears.ts" -ForegroundColor Green
}

# ============================================================
# 2. src/components/TopWornSneakers.tsx
# ============================================================
$topWornFile = @'
/**
 * TopWornSneakers — section "Les plus portees" du Dashboard.
 * Liste horizontale (scroll) des paires les plus portees de l'utilisateur
 * courant, triees desc par wear_count, excluant les DS. S'auto-masque s'il
 * n'y a aucune paire portee.
 */
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import {
  useMyTopWornSneakers,
  wearStatus,
  WEAR_STATUS_COLORS,
} from '@/lib/wears'

interface TopWornSneakersProps {
  limit?: number
}

export function TopWornSneakers({ limit = 10 }: TopWornSneakersProps) {
  const { data: sneakers = [], isLoading } = useMyTopWornSneakers(limit)

  // Auto-hide : ni en chargement (UX clean), ni si rien a montrer
  if (isLoading || sneakers.length === 0) return null

  return (
    <section style={sectionStyle}>
      <header style={headerStyle}>
        <h2 style={titleStyle}>LES PLUS PORTÉES</h2>
        <span style={subtitleStyle}>
          {sneakers.length < limit
            ? `${sneakers.length} ${sneakers.length > 1 ? 'paires' : 'paire'}`
            : `Top ${limit}`}
        </span>
      </header>
      <div style={scrollStyle}>
        {sneakers.map((s, i) => {
          const status = wearStatus(s.wear_count)
          const colors = WEAR_STATUS_COLORS[status]
          const photo = s.stockx_image_url || s.photo_url || ''
          return (
            <Link key={s.id} to={`/sneakers/${s.id}`} style={cardLinkStyle}>
              <div style={cardStyle}>
                <span style={rankStyle}>#{i + 1}</span>
                <div style={imageWrapStyle}>
                  {photo ? (
                    <img src={photo} alt={s.name} style={imgStyle} />
                  ) : (
                    <div style={imgPlaceholderStyle} />
                  )}
                </div>
                <div style={bodyStyle}>
                  {s.brand && <div style={brandStyle}>{s.brand}</div>}
                  <div style={nameStyle}>{s.name}</div>
                  <div style={metaRowStyle}>
                    <span style={countStyle}>
                      {s.wear_count} {s.wear_count > 1 ? 'wears' : 'wear'}
                    </span>
                    <span
                      style={{
                        ...badgeStyle,
                        background: colors.bg,
                        color: colors.fg,
                      }}
                    >
                      {status}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

// =================================================================
// Styles
// =================================================================
const sectionStyle: CSSProperties = { marginBottom: 24 }

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  marginBottom: 12,
  gap: 12,
}

const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display, \'Outfit\', sans-serif)',
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text, #0A0A0A)',
  margin: 0,
}

const subtitleStyle: CSSProperties = {
  fontSize: 12,
  color: 'var(--color-text-muted, #6B7280)',
  fontWeight: 500,
}

const scrollStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  paddingBottom: 8,
  WebkitOverflowScrolling: 'touch',
}

const cardLinkStyle: CSSProperties = {
  textDecoration: 'none',
  color: 'inherit',
  flex: '0 0 180px',
  scrollSnapAlign: 'start',
}

const cardStyle: CSSProperties = {
  position: 'relative',
  background: 'var(--color-surface, #FFFFFF)',
  border: '1px solid var(--color-border, #E5E7EB)',
  borderRadius: 8,
  overflow: 'hidden',
  transition: 'border-color var(--transition-fast, 120ms)',
}

const rankStyle: CSSProperties = {
  position: 'absolute',
  top: 8,
  left: 8,
  zIndex: 1,
  padding: '3px 8px',
  background: 'var(--color-text, #0A0A0A)',
  color: '#FFFFFF',
  fontSize: 11,
  fontWeight: 700,
  borderRadius: 4,
  fontFamily: "'Outfit', sans-serif",
}

const imageWrapStyle: CSSProperties = {
  aspectRatio: '1.15',
  background: 'var(--color-bg, #F9FAFB)',
  overflow: 'hidden',
}

const imgStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
}

const imgPlaceholderStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'var(--color-bg, #F9FAFB)',
}

const bodyStyle: CSSProperties = { padding: 10 }

const brandStyle: CSSProperties = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--color-text-muted, #6B7280)',
  fontWeight: 600,
  marginBottom: 2,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const nameStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.3,
  color: 'var(--color-text, #0A0A0A)',
  marginBottom: 8,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  minHeight: 32,
}

const metaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 6,
}

const countStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text, #0A0A0A)',
  fontVariantNumeric: 'tabular-nums',
}

const badgeStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  padding: '2px 7px',
  borderRadius: 999,
  whiteSpace: 'nowrap',
  letterSpacing: '0.02em',
  fontFamily: "'Outfit', sans-serif",
}
'@
Write-FileUtf8NoBom -Path "src/components/TopWornSneakers.tsx" -Content $topWornFile
Write-Host "  +  src/components/TopWornSneakers.tsx" -ForegroundColor Green

# ============================================================
# 3. Dashboard.tsx : import + insertion <TopWornSneakers limit={10} />
# ============================================================
$dashPath = "src/pages/Dashboard.tsx"
$dash = Read-FileUtf8 $dashPath

# 3a. Import
if ($dash -match "TopWornSneakers") {
    Write-Host "  =  Import TopWornSneakers deja present" -ForegroundColor DarkGray
} else {
    $anchor = "import { TopOwnedModels } from '@/components/TopOwnedModels'"
    if ($dash.Contains($anchor)) {
        $newImports = "$anchor`r`nimport { TopWornSneakers } from '@/components/TopWornSneakers'"
        $dash = $dash.Replace($anchor, $newImports)
        Write-Host "  +  Import TopWornSneakers ajoute" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre import TopOwnedModels non trouvee" -ForegroundColor Yellow
    }
}

# 3b. Render : juste apres <TopOwnedModels limit={5} />
if ($dash -match "<TopWornSneakers") {
    Write-Host "  =  <TopWornSneakers /> deja rendu" -ForegroundColor DarkGray
} else {
    $renderAnchor = "<TopOwnedModels limit={5} />"
    if ($dash.Contains($renderAnchor)) {
        $renderNew = @'
<TopOwnedModels limit={5} />

        {/* User's most-worn paires — hides if no paires have been worn */}
        <TopWornSneakers limit={10} />
'@
        $dash = $dash.Replace($renderAnchor, $renderNew)
        Write-Host "  +  <TopWornSneakers limit={10} /> insere apres TopOwnedModels" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre <TopOwnedModels limit={5} /> non trouvee" -ForegroundColor Yellow
    }
}

Write-FileUtf8NoBom -Path $dashPath -Content $dash

# ============================================================
# 4. SneakerCard.tsx : badge statut + bouton +1 inline
# ============================================================
$cardPath = "src/components/SneakerCard.tsx"
$card = Read-FileUtf8 $cardPath

# 4a. Imports : ajoute wearStatus + WEAR_STATUS_COLORS + useIncrementWear
if ($card -match "useIncrementWear") {
    Write-Host "  =  Imports wears deja presents dans SneakerCard" -ForegroundColor DarkGray
} else {
    $impAnchor = "import { OwnerCountBadge } from './OwnerCountBadge'"
    if ($card.Contains($impAnchor)) {
        $impNew = "$impAnchor`r`nimport { wearStatus, WEAR_STATUS_COLORS, useIncrementWear } from '@/lib/wears'"
        $card = $card.Replace($impAnchor, $impNew)
        Write-Host "  +  Imports wears (wearStatus, COLORS, useIncrementWear) ajoutes" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre import OwnerCountBadge non trouvee" -ForegroundColor Yellow
    }
}

# 4b. Hook useIncrementWear dans le composant (apres useT)
if ($card -match "const inc = useIncrementWear\(\)") {
    Write-Host "  =  Hook useIncrementWear deja appele dans SneakerCard" -ForegroundColor DarkGray
} else {
    $hookAnchor = "const { t } = useT()"
    if ($card.Contains($hookAnchor)) {
        $hookNew = "$hookAnchor`r`n  const inc = useIncrementWear()"
        $card = $card.Replace($hookAnchor, $hookNew)
        Write-Host "  +  const inc = useIncrementWear() ajoute" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre 'const { t } = useT()' non trouvee" -ForegroundColor Yellow
    }
}

# 4c. JSX : ajoute le badge statut + bouton +1 apres le wrap OwnerCountBadge
if ($card -match "statusBadgeOnCardStyle") {
    Write-Host "  =  JSX badge statut + bouton +1 deja present" -ForegroundColor DarkGray
} else {
    # Match le bloc complet : <div style={ownerBadgeWrapStyle}>...</div>
    $jsxPattern = "(?s)(<div style=\{ownerBadgeWrapStyle\}>\s*<OwnerCountBadge[^/]*/>\s*</div>)"
    if ($card -match $jsxPattern) {
        $jsxAdd = @'

          {/* Wear status badge — bottom-left */}
          <span
            style={{
              ...statusBadgeOnCardStyle,
              background: WEAR_STATUS_COLORS[wearStatus(sneaker.wear_count)].bg,
              color: WEAR_STATUS_COLORS[wearStatus(sneaker.wear_count)].fg,
            }}
          >
            {wearStatus(sneaker.wear_count)}
          </span>
          {/* Inline +1 wear button — bottom-right (stops Link nav) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              inc.mutate(sneaker.id)
            }}
            disabled={inc.isPending}
            style={incrementBtnOnCardStyle}
            aria-label="Incrémenter le compteur de wears"
          >
            +1
          </button>
'@
        $replacement = '$1' + $jsxAdd
        $card = [regex]::Replace($card, $jsxPattern, $replacement, 'Singleline', 1)
        Write-Host "  +  JSX badge statut + bouton +1 ajoute dans <div imageStyle>" -ForegroundColor Green
    } else {
        Write-Host "WARN  Pattern <div ownerBadgeWrapStyle> non matche" -ForegroundColor Yellow
    }
}

# 4d. Styles : ajoute les 2 nouveaux styles a la fin du fichier
if ($card -match "statusBadgeOnCardStyle:") {
    Write-Host "  =  Styles statusBadge/incrementBtn deja presents" -ForegroundColor DarkGray
} else {
    $styleAdd = @'

// Wear status badge sur la carte (bottom-left de l'image).
// Position absolue, miroir de forSaleRibbon (top-left) sur l'axe vertical.
const statusBadgeOnCardStyle: CSSProperties = {
  position: 'absolute',
  bottom: 8,
  left: 8,
  zIndex: 1,
  padding: '3px 8px',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.04em',
  borderRadius: 'var(--radius-sm)',
  fontFamily: "'Outfit', sans-serif",
}

// Bouton +1 inline sur la carte (bottom-right de l'image).
// Position absolue, miroir de ownerBadgeWrap (top-right). z-index plus eleve
// pour passer au-dessus de la photo. preventDefault dans le onClick pour
// ne pas trigger le <Link> parent.
const incrementBtnOnCardStyle: CSSProperties = {
  position: 'absolute',
  bottom: 8,
  right: 8,
  zIndex: 2,
  width: 32,
  height: 32,
  borderRadius: '50%',
  border: 'none',
  background: 'var(--color-bred, #CE1141)',
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Outfit', sans-serif",
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.20)',
  transition: 'transform 120ms ease, opacity 120ms ease',
}
'@
    $card = $card.TrimEnd() + $styleAdd + "`r`n"
    Write-Host "  +  Styles statusBadgeOnCardStyle + incrementBtnOnCardStyle ajoutes" -ForegroundColor Green
}

Write-FileUtf8NoBom -Path $cardPath -Content $card

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Select-String -Path src/lib/wears.ts -Pattern "useMyTopWornSneakers" |
    ForEach-Object { "  wears.ts:$($_.LineNumber) : $($_.Line.Trim())" }
Get-ChildItem src/components/TopWornSneakers.tsx -ErrorAction SilentlyContinue |
    ForEach-Object { "  + $($_.FullName.Replace((Get-Location).Path, '.').Replace('\','/'))" }
Select-String -Path src/pages/Dashboard.tsx -Pattern "TopWornSneakers" |
    ForEach-Object { "  Dashboard:$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path src/components/SneakerCard.tsx -Pattern "useIncrementWear|wearStatus|statusBadgeOnCardStyle|incrementBtnOnCardStyle" |
    Select-Object -First 8 |
    ForEach-Object { "  SneakerCard:$($_.LineNumber) : $($_.Line.Trim())" }

# Anti double-encodage
$bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path "src/components/TopWornSneakers.tsx"))
$u = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($u -match "Ã©|Ã¨|Ã |Ã€") {
    Write-Host "  ERREUR : double-encodage TopWornSneakers.tsx" -ForegroundColor Red
} else {
    Write-Host "  OK : TopWornSneakers.tsx UTF-8 propre" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Phase 2B appliquee ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Suite :" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  git add -A" -ForegroundColor White
Write-Host "  git commit -m `"feat(wears): top 10 worn section + status badge & +1 on cards`"" -ForegroundColor White
Write-Host "  git push origin dev" -ForegroundColor White
Write-Host ""
Write-Host "Tests :" -ForegroundColor Yellow
Write-Host "  1. Dashboard : section 'LES PLUS PORTEES' apparait sous 'LES PLUS COLLECTIONNEES'" -ForegroundColor White
Write-Host "     (si t'as deja au moins 1 paire avec wear_count > 0 grace au seeding migration)" -ForegroundColor White
Write-Host "  2. Carte sneaker : badge statut colore bottom-left + bouton rouge '+1' bottom-right" -ForegroundColor White
Write-Host "  3. Clic sur '+1' : incremente sans naviguer vers la fiche (preventDefault marche)" -ForegroundColor White
Write-Host "  4. Clic sur le reste de la carte : navigue vers la fiche normalement" -ForegroundColor White
Write-Host ""
Write-Host "Reste pour Phase 2C (filtre statut sur /u/:pseudo) :" -ForegroundColor Yellow
Write-Host "  Envoie-moi : Get-Content src/lib/publicProfileQueries.ts" -ForegroundColor White
Write-Host ""
