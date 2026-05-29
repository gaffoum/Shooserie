# ============================================================
#  Shooserie - Wear Tracking Phase 1
#  - Helper wearStatus + hooks RPC
#  - Composant WearTracker (compteur, boutons, modale reset)
#  - Patches : types.ts, SneakerDetail, MarketplaceDetail, SneakerForm
# ============================================================
#  Prerequis : la migration SQL est deja appliquee (wear_count + RPC)
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
Write-Host "=== Wear Tracking Phase 1 ===" -ForegroundColor Cyan
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
# 1. src/lib/wears.ts  (helper + hooks)
# ============================================================
$wearsFile = @'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

// =============================================================
// Statuts dérivés du compteur de wears.
// Paliers : DS (0) -> VNDS (1-2) -> 9/10 (3-10) -> 8/10 (11-30) -> Beater (31+)
// =============================================================

export type WearStatus = 'DS' | 'VNDS' | '9/10' | '8/10' | 'Beater'

export function wearStatus(count: number | null | undefined): WearStatus {
  const c = count ?? 0
  if (c <= 0) return 'DS'
  if (c <= 2) return 'VNDS'
  if (c <= 10) return '9/10'
  if (c <= 30) return '8/10'
  return 'Beater'
}

/** Couleurs de badge par statut. */
export const WEAR_STATUS_COLORS: Record<
  WearStatus,
  { bg: string; fg: string; border: string }
> = {
  DS:       { bg: '#10B981', fg: '#FFFFFF', border: '#059669' },
  VNDS:     { bg: '#0EA5E9', fg: '#FFFFFF', border: '#0284C7' },
  '9/10':   { bg: '#F59E0B', fg: '#1F1300', border: '#D97706' },
  '8/10':   { bg: '#F97316', fg: '#FFFFFF', border: '#EA580C' },
  Beater:   { bg: '#7C2D12', fg: '#FFFFFF', border: '#5C1810' },
}

/** Libellé long (utile en tooltip ou en sous-titre). */
export function wearStatusLabel(status: WearStatus): string {
  switch (status) {
    case 'DS': return 'Deadstock — jamais portée'
    case 'VNDS': return 'Very Near Deadstock — état quasi-neuf'
    case '9/10': return 'Très bon état — portée quelques fois'
    case '8/10': return 'Bon état — portée régulièrement'
    case 'Beater': return 'Beater — paire portée à fond'
  }
}

// =============================================================
// Hooks d'incrémentation / décrémentation / reset
// Atomiques via RPC Postgres (pas de race condition).
// =============================================================

function invalidateAll(qc: ReturnType<typeof useQueryClient>, sneakerId: string) {
  qc.invalidateQueries({ queryKey: ['sneaker', sneakerId] })
  qc.invalidateQueries({ queryKey: ['sneakers'] })
  qc.invalidateQueries({ queryKey: ['user-sneakers'] })
  qc.invalidateQueries({ queryKey: ['top-worn'] })
  qc.invalidateQueries({ queryKey: ['most-collected'] })
}

export function useIncrementWear() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sneakerId: string) => {
      const { data, error } = await supabase.rpc('increment_wear', {
        p_sneaker_id: sneakerId,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, sneakerId) => invalidateAll(qc, sneakerId),
  })
}

export function useDecrementWear() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sneakerId: string) => {
      const { data, error } = await supabase.rpc('decrement_wear', {
        p_sneaker_id: sneakerId,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, sneakerId) => invalidateAll(qc, sneakerId),
  })
}

export function useResetWears() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (sneakerId: string) => {
      const { data, error } = await supabase.rpc('reset_wears', {
        p_sneaker_id: sneakerId,
      })
      if (error) throw error
      return data
    },
    onSuccess: (_data, sneakerId) => invalidateAll(qc, sneakerId),
  })
}
'@
Write-FileUtf8NoBom -Path "src/lib/wears.ts" -Content $wearsFile
Write-Host "  +  src/lib/wears.ts" -ForegroundColor Green

# ============================================================
# 2. src/components/WearTracker.tsx
# ============================================================
$wearTrackerFile = @'
/**
 * WearTracker — section "Portée" sur la fiche sneaker.
 * Compteur + statut dérivé + boutons +1 / -1 / Reset (modale).
 *
 * Usage :
 *   <WearTracker
 *     sneakerId={sneaker.id}
 *     wearCount={sneaker.wear_count}
 *     lastWornAt={sneaker.last_worn_at}
 *   />
 */
import { useState } from 'react'
import type { CSSProperties } from 'react'
import {
  useIncrementWear,
  useDecrementWear,
  useResetWears,
  wearStatus,
  wearStatusLabel,
  WEAR_STATUS_COLORS,
} from '../lib/wears'

interface WearTrackerProps {
  sneakerId: string
  wearCount: number | null | undefined
  lastWornAt: string | null | undefined
}

export function WearTracker({
  sneakerId,
  wearCount,
  lastWornAt,
}: WearTrackerProps) {
  const inc = useIncrementWear()
  const dec = useDecrementWear()
  const reset = useResetWears()
  const [confirmReset, setConfirmReset] = useState(false)

  const count = wearCount ?? 0
  const status = wearStatus(count)
  const colors = WEAR_STATUS_COLORS[status]
  const busy = inc.isPending || dec.isPending || reset.isPending

  return (
    <div style={cardStyle}>
      <div style={topRowStyle}>
        <div>
          <div style={labelStyle}>Portée</div>
          <div style={countStyle}>
            <span style={countNumberStyle}>{count}</span>
            <span style={countUnitStyle}>
              {count > 1 ? 'fois' : count === 1 ? 'fois' : 'fois'}
            </span>
          </div>
        </div>
        <span
          style={{
            ...badgeStyle,
            background: colors.bg,
            color: colors.fg,
            borderColor: colors.border,
          }}
          title={wearStatusLabel(status)}
        >
          {status}
        </span>
      </div>

      {lastWornAt && (
        <div style={lastWornStyle}>
          Dernier port :{' '}
          {new Date(lastWornAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      )}

      <div style={btnRowStyle}>
        <button
          type="button"
          onClick={() => dec.mutate(sneakerId)}
          disabled={busy || count === 0}
          style={count === 0 ? secondaryBtnDisabledStyle : secondaryBtnStyle}
          aria-label="Décrémenter le compteur"
        >
          −1
        </button>
        <button
          type="button"
          onClick={() => inc.mutate(sneakerId)}
          disabled={busy}
          style={primaryBtnStyle}
        >
          +1 wear
        </button>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          disabled={busy || count === 0}
          style={count === 0 ? resetBtnDisabledStyle : resetBtnStyle}
        >
          Reset
        </button>
      </div>

      {(inc.isError || dec.isError || reset.isError) && (
        <div style={errorStyle}>
          {(inc.error || dec.error || reset.error)?.message ??
            'Erreur, réessaie.'}
        </div>
      )}

      {confirmReset && (
        <ResetModal
          onConfirm={() => {
            reset.mutate(sneakerId)
            setConfirmReset(false)
          }}
          onCancel={() => setConfirmReset(false)}
        />
      )}
    </div>
  )
}

function ResetModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={modalTitleStyle}>Réinitialiser le compteur ?</h3>
        <p style={modalTextStyle}>
          Le statut reviendra à <strong>DS</strong> et la date du dernier port
          sera effacée. Cette action est définitive.
        </p>
        <div style={modalBtnRowStyle}>
          <button type="button" onClick={onCancel} style={secondaryBtnStyle}>
            Annuler
          </button>
          <button type="button" onClick={onConfirm} style={dangerBtnStyle}>
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  )
}

// =================================================================
// Styles — design tokens Shooserie
// =================================================================
const FONT = "'Outfit', sans-serif"
const TEXT = '#0A0A0A'
const MUTED = '#6B7280'
const BORDER = '#E5E7EB'
const RED = '#CE1141'
const CARD = '#FFFFFF'
const SOFT = '#F9FAFB'

const cardStyle: CSSProperties = {
  background: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 20,
  fontFamily: FONT,
  color: TEXT,
}

const topRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 12,
}

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: MUTED,
  marginBottom: 4,
}

const countStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 6,
}

const countNumberStyle: CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  letterSpacing: '-0.02em',
  fontVariantNumeric: 'tabular-nums',
  color: TEXT,
}

const countUnitStyle: CSSProperties = {
  fontSize: 14,
  color: MUTED,
}

const badgeStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.04em',
  padding: '6px 12px',
  borderRadius: 999,
  border: '1px solid',
  whiteSpace: 'nowrap',
}

const lastWornStyle: CSSProperties = {
  fontSize: 13,
  color: MUTED,
  marginBottom: 16,
}

const btnRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
}

const baseBtn: CSSProperties = {
  fontFamily: FONT,
  fontSize: 14,
  fontWeight: 600,
  padding: '10px 18px',
  border: '1px solid',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'background 120ms ease, opacity 120ms ease',
}

const primaryBtnStyle: CSSProperties = {
  ...baseBtn,
  flex: '1 1 auto',
  background: RED,
  color: '#FFFFFF',
  borderColor: RED,
}

const secondaryBtnStyle: CSSProperties = {
  ...baseBtn,
  background: CARD,
  color: TEXT,
  borderColor: BORDER,
  minWidth: 60,
}

const secondaryBtnDisabledStyle: CSSProperties = {
  ...secondaryBtnStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
}

const resetBtnStyle: CSSProperties = {
  ...baseBtn,
  background: SOFT,
  color: MUTED,
  borderColor: BORDER,
}

const resetBtnDisabledStyle: CSSProperties = {
  ...resetBtnStyle,
  opacity: 0.4,
  cursor: 'not-allowed',
}

const dangerBtnStyle: CSSProperties = {
  ...baseBtn,
  background: '#DC2626',
  color: '#FFFFFF',
  borderColor: '#B91C1C',
}

const errorStyle: CSSProperties = {
  marginTop: 12,
  padding: '8px 12px',
  background: '#FEE2E2',
  color: '#991B1B',
  borderRadius: 6,
  fontSize: 13,
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 20,
}

const modalStyle: CSSProperties = {
  background: CARD,
  borderRadius: 12,
  padding: 24,
  maxWidth: 420,
  width: '100%',
  fontFamily: FONT,
  color: TEXT,
}

const modalTitleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '-0.01em',
  margin: '0 0 12px',
}

const modalTextStyle: CSSProperties = {
  fontSize: 14,
  color: MUTED,
  margin: '0 0 20px',
  lineHeight: 1.5,
}

const modalBtnRowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
}
'@
Write-FileUtf8NoBom -Path "src/components/WearTracker.tsx" -Content $wearTrackerFile
Write-Host "  +  src/components/WearTracker.tsx" -ForegroundColor Green

# ============================================================
# 3. Patch src/lib/types.ts : ajout wear_count + last_worn_at au type Sneaker
# ============================================================
$typesPath = "src/lib/types.ts"
$typesContent = Read-FileUtf8 $typesPath

if ($typesContent -match "\bwear_count\b") {
    Write-Host "  =  wear_count deja dans types.ts" -ForegroundColor DarkGray
} else {
    # Ancre : la ligne 'condition: SneakerCondition | null'
    $anchor = "condition: SneakerCondition | null"
    if ($typesContent.Contains($anchor)) {
        $replacement = "$anchor`r`n  wear_count: number`r`n  last_worn_at: string | null"
        $typesContent = $typesContent.Replace($anchor, $replacement)
        Write-FileUtf8NoBom -Path $typesPath -Content $typesContent
        Write-Host "  +  wear_count + last_worn_at ajoutes a Sneaker dans types.ts" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre 'condition: SneakerCondition' non trouvee dans types.ts" -ForegroundColor Yellow
        Write-Host "      Ajoute manuellement dans le type Sneaker :" -ForegroundColor Yellow
        Write-Host "        wear_count: number" -ForegroundColor Yellow
        Write-Host "        last_worn_at: string | null" -ForegroundColor Yellow
    }
}

# ============================================================
# 4. Patch src/pages/SneakerDetail.tsx
#    - import wearStatus + WearTracker
#    - remplace l'affichage de la condition (Meta)
# ============================================================
$detailPath = "src/pages/SneakerDetail.tsx"
$detailContent = Read-FileUtf8 $detailPath

# 4a. Import wearStatus
if ($detailContent -match "from\s+['""]@/lib/wears['""]") {
    Write-Host "  =  Import wears deja present dans SneakerDetail" -ForegroundColor DarkGray
} else {
    # Cherche la derniere ligne d'import et ajoute apres
    $lines = $detailContent -split "`r?`n"
    $lastImportIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^import\s") { $lastImportIdx = $i }
    }
    if ($lastImportIdx -ge 0) {
        $before = $lines[0..$lastImportIdx]
        $after = if ($lastImportIdx + 1 -lt $lines.Count) { $lines[($lastImportIdx + 1)..($lines.Count - 1)] } else { @() }
        $newLines = @($before) +
                    "import { wearStatus } from '@/lib/wears'" +
                    "import { WearTracker } from '@/components/WearTracker'" +
                    @($after)
        $detailContent = $newLines -join "`r`n"
        Write-Host "  +  Imports wearStatus + WearTracker ajoutes dans SneakerDetail" -ForegroundColor Green
    } else {
        Write-Host "WARN  Aucune ligne import dans SneakerDetail" -ForegroundColor Yellow
    }
}

# 4b. Remplace l'affichage du Meta condition par statut derive
$detailAnchor = '<Meta label={t(''detail.meta.condition'')} value={sneaker.condition || ''—''} />'
$detailNew = '<Meta label={t(''detail.meta.condition'')} value={wearStatus(sneaker.wear_count)} />'
if ($detailContent.Contains($detailNew)) {
    Write-Host "  =  Affichage condition deja migre vers wearStatus" -ForegroundColor DarkGray
} elseif ($detailContent.Contains($detailAnchor)) {
    $detailContent = $detailContent.Replace($detailAnchor, $detailNew)
    Write-Host "  +  Meta condition -> wearStatus(sneaker.wear_count)" -ForegroundColor Green
} else {
    # Fallback regex pour les variantes de quotes/espacement
    $rxPattern = "<Meta\s+label=\{t\(['""]detail\.meta\.condition['""]\)\}\s+value=\{sneaker\.condition[^}]*\}\s*/>"
    if ($detailContent -match $rxPattern) {
        $detailContent = [regex]::Replace(
            $detailContent,
            $rxPattern,
            "<Meta label={t('detail.meta.condition')} value={wearStatus(sneaker.wear_count)} />",
            'Singleline'
        )
        Write-Host "  +  Meta condition migre (fallback regex)" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre Meta condition non trouvee dans SneakerDetail" -ForegroundColor Yellow
    }
}

Write-FileUtf8NoBom -Path $detailPath -Content $detailContent

# ============================================================
# 5. Patch src/pages/MarketplaceDetail.tsx
# ============================================================
$marketPath = "src/pages/MarketplaceDetail.tsx"
$marketContent = Read-FileUtf8 $marketPath

# 5a. Import wearStatus
if ($marketContent -match "from\s+['""]@/lib/wears['""]") {
    Write-Host "  =  Import wears deja present dans MarketplaceDetail" -ForegroundColor DarkGray
} else {
    $lines = $marketContent -split "`r?`n"
    $lastImportIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^import\s") { $lastImportIdx = $i }
    }
    if ($lastImportIdx -ge 0) {
        $before = $lines[0..$lastImportIdx]
        $after = if ($lastImportIdx + 1 -lt $lines.Count) { $lines[($lastImportIdx + 1)..($lines.Count - 1)] } else { @() }
        $newLines = @($before) + "import { wearStatus } from '@/lib/wears'" + @($after)
        $marketContent = $newLines -join "`r`n"
        Write-Host "  +  Import wearStatus ajoute dans MarketplaceDetail" -ForegroundColor Green
    }
}

# 5b. Remplace {(sneaker as any).condition} par wearStatus
$marketOld = "{(sneaker as any).condition}"
$marketNew = "{wearStatus((sneaker as any).wear_count ?? 0)}"
if ($marketContent.Contains($marketNew)) {
    Write-Host "  =  MarketplaceDetail condition deja migre" -ForegroundColor DarkGray
} elseif ($marketContent.Contains($marketOld)) {
    $marketContent = $marketContent.Replace($marketOld, $marketNew)
    Write-Host "  +  MarketplaceDetail: condition -> wearStatus(wear_count)" -ForegroundColor Green
}

# 5c. Le conditionnel `{(sneaker as any).condition && (` devient inconditionnel
$marketCond = "{(sneaker as any).condition && ("
$marketCondNew = "{(sneaker as any).wear_count !== undefined && ("
if ($marketContent.Contains($marketCond)) {
    $marketContent = $marketContent.Replace($marketCond, $marketCondNew)
    Write-Host "  +  MarketplaceDetail: conditionnel d'affichage adapte" -ForegroundColor Green
}

Write-FileUtf8NoBom -Path $marketPath -Content $marketContent

# ============================================================
# 6. Patch src/components/SneakerForm.tsx : retire le Field 'condition'
# ============================================================
$formPath = "src/components/SneakerForm.tsx"
$formContent = Read-FileUtf8 $formPath

# Verif d'idempotence : si l'ancre 'form.field.condition' n'est plus la, c'est deja fait
if ($formContent -notmatch "form\.field\.condition") {
    Write-Host "  =  Field 'condition' deja retire de SneakerForm" -ForegroundColor DarkGray
} else {
    # Regex : matche <Field label={t('form.field.condition')}>... jusqu'a </Field>
    # On utilise un MatchEvaluator pour eviter les surprises de remplacement
    $pattern = "(?s)\s*<Field label=\{t\(['""]form\.field\.condition['""]\)\}>.*?</Field>\s*"
    $before = $formContent
    $formContent = [regex]::Replace($formContent, $pattern, "`r`n          ", 1)
    if ($formContent -ne $before) {
        Write-FileUtf8NoBom -Path $formPath -Content $formContent
        Write-Host "  ~  Field 'État' retire de SneakerForm (le picker manuel disparait)" -ForegroundColor Green
    } else {
        Write-Host "WARN  Pattern <Field ... condition ... </Field> non matche" -ForegroundColor Yellow
        Write-Host "      Retire-le manuellement dans SneakerForm.tsx." -ForegroundColor Yellow
    }
}

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Get-ChildItem src/lib/wears.ts, src/components/WearTracker.tsx | ForEach-Object {
    "  + $($_.FullName.Replace((Get-Location).Path, '.').Replace('\','/'))"
}
Select-String -Path src/lib/types.ts -Pattern "wear_count|last_worn_at" |
    ForEach-Object { "  types.ts:$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path src/pages/SneakerDetail.tsx, src/pages/MarketplaceDetail.tsx -Pattern "wearStatus|WearTracker" |
    ForEach-Object { "  $($_.Filename):$($_.LineNumber) : $($_.Line.Trim())" }

# Anti double-encodage
$bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path "src/components/WearTracker.tsx"))
$u = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($u -match "Ã©|Ã¨|Ã |Ã€") {
    Write-Host "  ERREUR : double-encodage WearTracker.tsx" -ForegroundColor Red
} else {
    Write-Host "  OK : WearTracker.tsx UTF-8 propre" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Phase 1 appliquee ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "ETAPE MANUELLE :" -ForegroundColor Yellow
Write-Host "  Le composant <WearTracker /> a ete cree mais n'est pas encore" -ForegroundColor Yellow
Write-Host "  insere dans SneakerDetail.tsx (j'ai pas la vue complete du JSX)." -ForegroundColor Yellow
Write-Host "  Ajoute quelque part dans le rendu de SneakerDetail :" -ForegroundColor Yellow
Write-Host ""
Write-Host "    <WearTracker" -ForegroundColor White
Write-Host "      sneakerId={sneaker.id}" -ForegroundColor White
Write-Host "      wearCount={sneaker.wear_count}" -ForegroundColor White
Write-Host "      lastWornAt={sneaker.last_worn_at}" -ForegroundColor White
Write-Host "    />" -ForegroundColor White
Write-Host ""
Write-Host "  L'import est deja en haut du fichier." -ForegroundColor Yellow
Write-Host ""
Write-Host "Suite :" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  git add -A" -ForegroundColor White
Write-Host "  git commit -m `"feat(wears): wear counter + derived status (DS/VNDS/9-10/8-10/Beater)`"" -ForegroundColor White
Write-Host "  git push origin dev" -ForegroundColor White
Write-Host ""
