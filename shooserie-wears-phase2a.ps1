# ============================================================
#  Shooserie - Wear Tracking Phase 2A
#   1. Composant WearStatusFilter (chips, jumeau de BrandFilter)
#   2. wears.ts : ajoute WEAR_STATUSES + hook useTopWornSneakers
#   3. Dashboard : import + state + clause filter + chips render
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
Write-Host "=== Wear Tracking Phase 2A : filtre statut Dashboard ===" -ForegroundColor Cyan
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
# 1. src/components/WearStatusFilter.tsx
# ============================================================
$filterFile = @'
/**
 * WearStatusFilter — chips de filtre par statut de wear.
 * Jumeau visuel de BrandFilter, avec la couleur du statut sur la chip active.
 */
import type { CSSProperties } from 'react'
import { WEAR_STATUSES, type WearStatus, WEAR_STATUS_COLORS } from '@/lib/wears'

interface WearStatusFilterProps {
  selected: WearStatus | null
  onChange: (status: WearStatus | null) => void
}

export function WearStatusFilter({ selected, onChange }: WearStatusFilterProps) {
  return (
    <div style={wrapStyle} role="group" aria-label="Filtre par état">
      <Chip
        label="TOUS"
        active={selected === null}
        onClick={() => onChange(null)}
      />
      {WEAR_STATUSES.map((status) => (
        <Chip
          key={status}
          label={status}
          active={selected === status}
          onClick={() => onChange(status)}
          accentBg={WEAR_STATUS_COLORS[status].bg}
          accentFg={WEAR_STATUS_COLORS[status].fg}
        />
      ))}
    </div>
  )
}

interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
  accentBg?: string
  accentFg?: string
}

function Chip({ label, active, onClick, accentBg, accentFg }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={chipStyle(active, accentBg, accentFg)}
    >
      {label}
    </button>
  )
}

const wrapStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
}

const chipStyle = (
  active: boolean,
  accentBg?: string,
  accentFg?: string,
): CSSProperties => {
  // Active + accent (statut coloré) → bg = couleur statut
  // Active sans accent (chip "TOUS") → bg = rouge brand
  // Inactive → chip neutre
  const bg = active ? (accentBg ?? '#CE1141') : 'var(--color-surface)'
  const fg = active ? (accentFg ?? '#FFFFFF') : 'var(--color-text)'
  const border = active ? bg : 'var(--color-border)'
  return {
    padding: '6px 14px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.02em',
    fontFamily: "'Outfit', sans-serif",
    background: bg,
    color: fg,
    border: `1px solid ${border}`,
    borderRadius: 999,
    cursor: 'pointer',
    transition: 'all 120ms ease',
    whiteSpace: 'nowrap',
  }
}
'@
Write-FileUtf8NoBom -Path "src/components/WearStatusFilter.tsx" -Content $filterFile
Write-Host "  +  src/components/WearStatusFilter.tsx" -ForegroundColor Green

# ============================================================
# 2. src/lib/wears.ts : ajoute WEAR_STATUSES + useTopWornSneakers
# ============================================================
$wearsPath = "src/lib/wears.ts"
$wears = Read-FileUtf8 $wearsPath

# 2a. Import useQuery (en plus de useMutation, useQueryClient)
if ($wears -match "useQuery\s*,") {
    Write-Host "  =  useQuery deja importe dans wears.ts" -ForegroundColor DarkGray
} else {
    $wears = $wears -replace `
        "import\s*\{\s*useMutation\s*,\s*useQueryClient\s*\}\s*from\s*'@tanstack/react-query'", `
        "import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'"
    Write-Host "  ~  useQuery ajoute aux imports react-query" -ForegroundColor Green
}

# 2b. Constante WEAR_STATUSES
if ($wears -match "WEAR_STATUSES") {
    Write-Host "  =  WEAR_STATUSES deja present" -ForegroundColor DarkGray
} else {
    # Insere apres la definition du type WearStatus
    $anchor = "export type WearStatus = 'DS' | 'VNDS' | '9/10' | '8/10' | 'Beater'"
    if ($wears.Contains($anchor)) {
        $insertion = "$anchor`r`n`r`n/** Tous les statuts de wear, dans l'ordre croissant d'usure. */`r`nexport const WEAR_STATUSES: WearStatus[] = ['DS', 'VNDS', '9/10', '8/10', 'Beater']"
        $wears = $wears.Replace($anchor, $insertion)
        Write-Host "  +  WEAR_STATUSES ajoute" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre 'export type WearStatus' non trouvee" -ForegroundColor Yellow
    }
}

# 2c. Hook useTopWornSneakers : top N paires portees par utilisateur
if ($wears -match "useTopWornSneakers") {
    Write-Host "  =  useTopWornSneakers deja present" -ForegroundColor DarkGray
} else {
    $hookCode = @'


// =============================================================
// Top N paires portees pour un utilisateur donne.
// Exclut les DS (wear_count = 0) — un top des paires effectivement portees.
// Hit l'index (user_id, wear_count DESC) pour rester rapide.
// =============================================================

export interface TopWornSneaker {
  id: string
  name: string
  brand: string | null
  photo_url: string | null
  stockx_image_url: string | null
  wear_count: number
  last_worn_at: string | null
}

export function useTopWornSneakers(userId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ['top-worn', userId, limit],
    queryFn: async (): Promise<TopWornSneaker[]> => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('sneakers')
        .select(
          'id, name, brand, photo_url, stockx_image_url, wear_count, last_worn_at',
        )
        .eq('user_id', userId)
        .gt('wear_count', 0)
        .order('wear_count', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data ?? []) as TopWornSneaker[]
    },
    enabled: !!userId,
  })
}
'@
    $wears = $wears.TrimEnd() + $hookCode + "`r`n"
    Write-Host "  +  Hook useTopWornSneakers + type TopWornSneaker ajoutes" -ForegroundColor Green
}

Write-FileUtf8NoBom -Path $wearsPath -Content $wears

# ============================================================
# 3. src/pages/Dashboard.tsx : import + state + filter + render
# ============================================================
$dashPath = "src/pages/Dashboard.tsx"
$dash = Read-FileUtf8 $dashPath

# 3a. Imports
if ($dash -match "WearStatusFilter") {
    Write-Host "  =  Imports WearStatusFilter/wearStatus deja presents" -ForegroundColor DarkGray
} else {
    $anchor = "import { BrandFilter } from '@/components/BrandFilter'"
    $replacement = "$anchor`r`nimport { WearStatusFilter } from '@/components/WearStatusFilter'`r`nimport { wearStatus, type WearStatus } from '@/lib/wears'"
    if ($dash.Contains($anchor)) {
        $dash = $dash.Replace($anchor, $replacement)
        Write-Host "  +  Imports WearStatusFilter + wearStatus ajoutes" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre 'import { BrandFilter }' non trouvee" -ForegroundColor Yellow
    }
}

# 3b. State wearStatusFilter (juste apres brandFilter)
if ($dash -match "wearStatusFilter") {
    Write-Host "  =  State wearStatusFilter deja present" -ForegroundColor DarkGray
} else {
    $anchor2 = "const [brandFilter, setBrandFilter] = useState<string | null>(null)"
    $replacement2 = "$anchor2`r`n  const [wearStatusFilter, setWearStatusFilter] = useState<WearStatus | null>(null)"
    if ($dash.Contains($anchor2)) {
        $dash = $dash.Replace($anchor2, $replacement2)
        Write-Host "  +  State wearStatusFilter ajoute" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre 'const [brandFilter, setBrandFilter]' non trouvee" -ForegroundColor Yellow
    }
}

# 3c. Clause filter dans le useMemo (juste apres la clause brandFilter)
$filterAnchor = "if (brandFilter && s.brand !== brandFilter) return false"
$filterAdd = "$filterAnchor`r`n      if (wearStatusFilter && wearStatus(s.wear_count) !== wearStatusFilter) return false"
if ($dash -match "wearStatus\(s\.wear_count\) !== wearStatusFilter") {
    Write-Host "  =  Clause filtre statut deja en place" -ForegroundColor DarkGray
} elseif ($dash.Contains($filterAnchor)) {
    $dash = $dash.Replace($filterAnchor, $filterAdd)
    Write-Host "  +  Clause filtre statut ajoutee dans le useMemo" -ForegroundColor Green
} else {
    Write-Host "WARN  Ancre filtre brandFilter non trouvee" -ForegroundColor Yellow
}

# 3d. wearStatusFilter dans le tableau des deps du useMemo
$depsAnchor = "[allSneakers, search, brandFilter, tagFilter, forSaleOnly, sortKey]"
$depsNew = "[allSneakers, search, brandFilter, wearStatusFilter, tagFilter, forSaleOnly, sortKey]"
if ($dash.Contains($depsNew)) {
    Write-Host "  =  wearStatusFilter deja dans les deps" -ForegroundColor DarkGray
} elseif ($dash.Contains($depsAnchor)) {
    $dash = $dash.Replace($depsAnchor, $depsNew)
    Write-Host "  +  wearStatusFilter ajoute aux deps useMemo" -ForegroundColor Green
} else {
    Write-Host "WARN  Tableau des deps du useMemo non trouve a l'identique" -ForegroundColor Yellow
}

# 3e. Render <WearStatusFilter /> juste apres <BrandFilter ... />
if ($dash -match "<WearStatusFilter") {
    Write-Host "  =  <WearStatusFilter /> deja rendu" -ForegroundColor DarkGray
} else {
    # Match le bloc BrandFilter complet (multiligne, non-greedy jusqu'au />)
    $brandFilterPattern = "(?s)(<BrandFilter[\s\S]*?/>)"
    if ($dash -match $brandFilterPattern) {
        $replacement3 = '$1' + "`r`n              <WearStatusFilter selected={wearStatusFilter} onChange={setWearStatusFilter} />"
        $dash = [regex]::Replace($dash, $brandFilterPattern, $replacement3, 'Singleline', 1)
        Write-Host "  +  <WearStatusFilter /> insere apres <BrandFilter />" -ForegroundColor Green
    } else {
        Write-Host "WARN  Bloc <BrandFilter ... /> non trouve" -ForegroundColor Yellow
    }
}

Write-FileUtf8NoBom -Path $dashPath -Content $dash

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Select-String -Path src/lib/wears.ts -Pattern "WEAR_STATUSES|useTopWornSneakers|useQuery" |
    Select-Object -First 5 |
    ForEach-Object { "  wears.ts:$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path src/pages/Dashboard.tsx -Pattern "WearStatusFilter|wearStatusFilter|wearStatus\(s\." |
    ForEach-Object { "  Dashboard:$($_.LineNumber) : $($_.Line.Trim())" }

# Anti-double-encodage
$bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path "src/components/WearStatusFilter.tsx"))
$u = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($u -match "Ã©|Ã¨|Ã |Ã€") {
    Write-Host "  ERREUR : double-encodage WearStatusFilter.tsx" -ForegroundColor Red
} else {
    Write-Host "  OK : WearStatusFilter.tsx UTF-8 propre" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Phase 2A appliquee ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Suite :" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  git add -A" -ForegroundColor White
Write-Host "  git commit -m `"feat(wears): status filter chips on dashboard + useTopWornSneakers hook`"" -ForegroundColor White
Write-Host "  git push origin dev" -ForegroundColor White
Write-Host ""
Write-Host "Test : Va sur le dashboard, sous les chips marque tu dois voir" -ForegroundColor Yellow
Write-Host "       une nouvelle ligne de chips TOUS / DS / VNDS / 9-10 / 8-10 / Beater." -ForegroundColor Yellow
Write-Host "       Combine marque + statut, ca filtre les deux a la fois." -ForegroundColor Yellow
Write-Host ""
