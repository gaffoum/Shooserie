# ============================================================
#  Shooserie - Wear Tracking Phase 2C
#   1. publicProfileQueries.ts : wear_count dans SELECT + type UserSneaker
#   2. UserProfile.tsx         : filtre statut (select) a cote du select marque
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path (Get-Location).Path $Path }
    [System.IO.File]::WriteAllText($full, $Content, (New-Object System.Text.UTF8Encoding $false))
}
function Read-FileUtf8 {
    param([string]$Path)
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path (Get-Location).Path $Path }
    return [System.IO.File]::ReadAllText($full, [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "=== Wear Tracking Phase 2C : filtre statut /u/:pseudo ===" -ForegroundColor Cyan
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
# 1. publicProfileQueries.ts : SELECT + UserSneaker type
# ============================================================
$pubPath = "src/lib/publicProfileQueries.ts"
$pub = Read-FileUtf8 $pubPath

# 1a. SELECT dans useUserSneakers : ajoute wear_count, last_worn_at avant le closing '
if ($pub -match "wear_count" -and $pub -match "'id, user_id, name, brand[^']*wear_count") {
    Write-Host "  =  wear_count deja dans le SELECT" -ForegroundColor DarkGray
} else {
    $oldSelect = "'id, user_id, name, brand, photo_url, stockx_image_url, size_eu, size_us, is_for_sale, listing_price, target_sale_price, created_at'"
    $newSelect = "'id, user_id, name, brand, photo_url, stockx_image_url, size_eu, size_us, is_for_sale, listing_price, target_sale_price, created_at, wear_count, last_worn_at'"
    if ($pub.Contains($oldSelect)) {
        $pub = $pub.Replace($oldSelect, $newSelect)
        Write-Host "  +  wear_count + last_worn_at ajoutes au SELECT de useUserSneakers" -ForegroundColor Green
    } else {
        Write-Host "WARN  SELECT useUserSneakers non trouve a l'identique" -ForegroundColor Yellow
    }
}

# 1b. UserSneaker type : ajoute wear_count + last_worn_at apres created_at
if ($pub -match "wear_count:\s*number" -and $pub -match "last_worn_at:\s*string\s*\|\s*null") {
    Write-Host "  =  Type UserSneaker deja enrichi" -ForegroundColor DarkGray
} else {
    # Anchor : la fin du type UserSneaker (created_at: string suivi de })
    $oldType = "  is_for_sale: boolean | null`r`n  listing_price: number | null`r`n  target_sale_price: number | null`r`n  created_at: string`r`n}"
    $newType = "  is_for_sale: boolean | null`r`n  listing_price: number | null`r`n  target_sale_price: number | null`r`n  created_at: string`r`n  wear_count: number`r`n  last_worn_at: string | null`r`n}"
    if ($pub.Contains($oldType)) {
        $pub = $pub.Replace($oldType, $newType)
        Write-Host "  +  wear_count + last_worn_at ajoutes au type UserSneaker" -ForegroundColor Green
    } else {
        # Fallback : essaie sans CRLF (au cas ou le fichier est en LF)
        $oldTypeLf = "  is_for_sale: boolean | null`n  listing_price: number | null`n  target_sale_price: number | null`n  created_at: string`n}"
        $newTypeLf = "  is_for_sale: boolean | null`n  listing_price: number | null`n  target_sale_price: number | null`n  created_at: string`n  wear_count: number`n  last_worn_at: string | null`n}"
        if ($pub.Contains($oldTypeLf)) {
            $pub = $pub.Replace($oldTypeLf, $newTypeLf)
            Write-Host "  +  wear_count + last_worn_at ajoutes au type UserSneaker (LF)" -ForegroundColor Green
        } else {
            Write-Host "WARN  Bloc UserSneaker (jusqu'a created_at) non trouve. Ajoute manuellement :" -ForegroundColor Yellow
            Write-Host "        wear_count: number" -ForegroundColor Yellow
            Write-Host "        last_worn_at: string | null" -ForegroundColor Yellow
        }
    }
}

Write-FileUtf8NoBom -Path $pubPath -Content $pub

# ============================================================
# 2. UserProfile.tsx : filtre statut
# ============================================================
$upPath = "src/pages/UserProfile.tsx"
$up = Read-FileUtf8 $upPath

# 2a. Imports : wearStatus + WEAR_STATUSES
if ($up -match "from\s+['""]@/lib/wears['""]") {
    Write-Host "  =  Imports wears deja presents dans UserProfile" -ForegroundColor DarkGray
} else {
    # Cherche la derniere ligne d'import et ajoute apres
    $lines = $up -split "`r?`n"
    $lastImportIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^import\s") { $lastImportIdx = $i }
    }
    if ($lastImportIdx -ge 0) {
        $before = $lines[0..$lastImportIdx]
        $after = if ($lastImportIdx + 1 -lt $lines.Count) { $lines[($lastImportIdx + 1)..($lines.Count - 1)] } else { @() }
        $newLines = @($before) + "import { wearStatus, WEAR_STATUSES } from '@/lib/wears'" + @($after)
        $up = $newLines -join "`r`n"
        Write-Host "  +  Import wearStatus + WEAR_STATUSES ajoute" -ForegroundColor Green
    }
}

# 2b. State statusFilter : ajoute apres brandFilter
if ($up -match "statusFilter") {
    Write-Host "  =  State statusFilter deja present" -ForegroundColor DarkGray
} else {
    $stateAnchor = "const [brandFilter, setBrandFilter] = useState<string>('all')"
    $stateNew = "$stateAnchor`r`n  const [statusFilter, setStatusFilter] = useState<string>('all')"
    if ($up.Contains($stateAnchor)) {
        $up = $up.Replace($stateAnchor, $stateNew)
        Write-Host "  +  State statusFilter ajoute" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre brandFilter useState non trouvee" -ForegroundColor Yellow
    }
}

# 2c. useMemo filtered : combine marque + statut
if ($up -match "if \(statusFilter !== 'all'") {
    Write-Host "  =  useMemo filtered deja adapte" -ForegroundColor DarkGray
} else {
    $oldMemo = @'
  const filtered = useMemo(() => {
    if (brandFilter === 'all') return sneakers
    return sneakers.filter((s) => s.brand === brandFilter)
  }, [sneakers, brandFilter])
'@
    $newMemo = @'
  const filtered = useMemo(() => {
    return sneakers.filter((s) => {
      if (brandFilter !== 'all' && s.brand !== brandFilter) return false
      if (statusFilter !== 'all' && wearStatus(s.wear_count) !== statusFilter) return false
      return true
    })
  }, [sneakers, brandFilter, statusFilter])
'@
    # Normalisation EOL avant comparaison
    $upNormalized = $up -replace "`r`n", "`n"
    $oldMemoNorm = $oldMemo -replace "`r`n", "`n"
    if ($upNormalized.Contains($oldMemoNorm)) {
        $up = $upNormalized.Replace($oldMemoNorm, ($newMemo -replace "`r`n", "`n")) -replace "`n", "`r`n"
        Write-Host "  +  useMemo filtered combine marque + statut" -ForegroundColor Green
    } else {
        Write-Host "WARN  Bloc useMemo filtered non trouve a l'identique. Adapte manuellement." -ForegroundColor Yellow
    }
}

# 2d. JSX : ajoute le select statut apres le select marque
if ($up -match "Filtrer par .{0,3}tat") {
    Write-Host "  =  Select statut deja present dans le JSX" -ForegroundColor DarkGray
} else {
    # Match le bloc complet du select marque (multiligne, non-greedy)
    $brandSelectPattern = "(?s)(<select\s+value=\{brandFilter\}[\s\S]*?</select>)"
    if ($up -match $brandSelectPattern) {
        $statusSelectJsx = @'

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={selectStyle}
              aria-label="Filtrer par état"
            >
              <option value="all">Tous les états</option>
              {WEAR_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
'@
        $replacement = '$1' + $statusSelectJsx
        $up = [regex]::Replace($up, $brandSelectPattern, $replacement, 'Singleline', 1)
        Write-Host "  +  Select statut insere apres le select marque" -ForegroundColor Green
    } else {
        Write-Host "WARN  Bloc select marque non trouve" -ForegroundColor Yellow
    }
}

Write-FileUtf8NoBom -Path $upPath -Content $up

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Select-String -Path $pubPath -Pattern "wear_count|last_worn_at" |
    ForEach-Object { "  publicProfileQueries:$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path $upPath -Pattern "statusFilter|WEAR_STATUSES|wearStatus" |
    Select-Object -First 10 |
    ForEach-Object { "  UserProfile:$($_.LineNumber) : $($_.Line.Trim())" }

# Anti-double-encodage
$bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $upPath))
$u = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($u -match "Ã©|Ã¨|Ã |Ã€") {
    Write-Host "  ERREUR : double-encodage UserProfile.tsx" -ForegroundColor Red
} else {
    Write-Host "  OK : UserProfile.tsx UTF-8 propre" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Phase 2C appliquee ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Suite :" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  git add -A" -ForegroundColor White
Write-Host "  git commit -m `"feat(wears): status filter on /u/:pseudo + wear_count in UserSneaker`"" -ForegroundColor White
Write-Host "  git push origin dev" -ForegroundColor White
Write-Host ""
Write-Host "Test :" -ForegroundColor Yellow
Write-Host "  1. Va sur /u/Layon (ou autre pseudo public)" -ForegroundColor White
Write-Host "  2. A cote du select 'Toutes les marques', tu dois voir 'Tous les etats'" -ForegroundColor White
Write-Host "  3. Selectionne 'VNDS' -> uniquement les paires VNDS de cet user" -ForegroundColor White
Write-Host "  4. Combine marque + etat -> les 2 filtres s'appliquent ensemble" -ForegroundColor White
Write-Host ""
Write-Host "  => Phase 2 COMPLETE !" -ForegroundColor Green
Write-Host "  => Plus tard : Phase 3 = page /rankings dediee" -ForegroundColor Yellow
Write-Host ""
