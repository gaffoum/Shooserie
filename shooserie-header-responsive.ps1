# ============================================================
#  Shooserie - Fix responsive AppHeader (mobile overlap)
#  1. Bouton Communaute -> icone seule sous 640px
#  2. Logo -> flexShrink: 0 (plus de troncature)
#  3. Badge admin -> masque sous 640px
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
Write-Host "=== Fix responsive AppHeader ===" -ForegroundColor Cyan
$currentBranch = ""
try { $currentBranch = (git branch --show-current 2>$null).Trim() } catch {}
Write-Host "Branche actuelle : $currentBranch"
if ($currentBranch -ne "dev") {
    Write-Host "WARN  Pas sur 'dev' (actuelle: '$currentBranch')" -ForegroundColor Red
    $c = Read-Host "Continuer ? (o/N)"
    if ($c -ne "o" -and $c -ne "O") { exit 0 }
}
Write-Host ""

# ============================================================
# 1. AppHeader.tsx
# ============================================================
$hp = "src/components/AppHeader.tsx"
$h = Read-FileUtf8 $hp

# --- 1a. Logo flexShrink: 0 ---
$logoAnchor = "<Link to=`"/dashboard`" style={{ color: 'inherit', textDecoration: 'none' }}>"
$logoNew = "<Link to=`"/dashboard`" style={{ color: 'inherit', textDecoration: 'none', flexShrink: 0 }}>"
if ($h.Contains($logoNew)) {
    Write-Host "  =  Logo flexShrink deja present" -ForegroundColor DarkGray
} elseif ($h.Contains($logoAnchor)) {
    $h = $h.Replace($logoAnchor, $logoNew)
    Write-Host "  +  Logo flexShrink: 0 ajoute" -ForegroundColor Green
} else {
    Write-Host "WARN  Ancre logo Link non trouvee a l'identique" -ForegroundColor Yellow
}

# --- 1b. Communaute : icone + span responsive ---
if ($h -match "app-header-action-text.*Communaut") {
    Write-Host "  =  Contenu Link Communaute deja adapte" -ForegroundColor DarkGray
} else {
    # Remplace le texte nu "Communauté" entre > et </Link> par icone + span.
    # MatchEvaluator => remplacement litteral, pas d'interpretation des $ regex.
    $evaluator = {
        param($m)
        ">`r`n            <CommunityIcon />`r`n            <span className=`"app-header-action-text`">Communauté</span>`r`n          </Link>"
    }
    $newH = [regex]::Replace($h, ">\s*Communaut\u00e9\s*</Link>", $evaluator, 'Singleline')
    if ($newH -ne $h) {
        $h = $newH
        Write-Host "  +  Contenu du Link Communaute -> icone + span responsive" -ForegroundColor Green
    } else {
        Write-Host "WARN  Texte 'Communauté' dans le Link non trouve" -ForegroundColor Yellow
    }
}

# --- 1c. Composant CommunityIcon (icone compass) ---
if ($h -match "function\s+CommunityIcon") {
    Write-Host "  =  function CommunityIcon deja presente" -ForegroundColor DarkGray
} else {
    $iconAnchor = "function UserIcon() {"
    $iconBlock = @'
function CommunityIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function UserIcon() {
'@
    if ($h.Contains($iconAnchor)) {
        $h = $h.Replace($iconAnchor, $iconBlock)
        Write-Host "  +  Composant CommunityIcon ajoute" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre 'function UserIcon()' non trouvee" -ForegroundColor Yellow
    }
}

Write-FileUtf8NoBom -Path $hp -Content $h

# ============================================================
# 2. index.css : masquer le badge admin sous 640px
# ============================================================
$cssPath = "src/index.css"
if (-not (Test-Path $cssPath)) {
    # Au cas ou index.css serait ailleurs
    $found = Get-ChildItem src -Recurse -Filter "index.css" -File | Select-Object -First 1
    if ($found) { $cssPath = $found.FullName }
}
$css = Read-FileUtf8 $cssPath

if ($css -match "\.app-header-badge\s*\{\s*display:\s*none") {
    Write-Host "  =  .app-header-badge deja masque sur mobile" -ForegroundColor DarkGray
} else {
    $cssAnchor = ".app-header-add-text { display: none !important; }"
    $cssNew = ".app-header-add-text { display: none !important; }`r`n  .app-header-badge { display: none !important; }"
    if ($css.Contains($cssAnchor)) {
        $css = $css.Replace($cssAnchor, $cssNew)
        Write-FileUtf8NoBom -Path $cssPath -Content $css
        Write-Host "  +  .app-header-badge masque sous 640px ($cssPath)" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre .app-header-add-text non trouvee dans $cssPath" -ForegroundColor Yellow
        Write-Host "      Ajoute manuellement dans @media (max-width: 639px) :" -ForegroundColor Yellow
        Write-Host "        .app-header-badge { display: none !important; }" -ForegroundColor Yellow
    }
}

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Select-String -Path $hp -Pattern "flexShrink: 0|CommunityIcon|app-header-action-text" |
    ForEach-Object { "  AppHeader.tsx:$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path $cssPath -Pattern "app-header-badge" |
    ForEach-Object { "  index.css:$($_.LineNumber) : $($_.Line.Trim())" }

# Anti double-encodage
$bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $hp))
$u = [System.Text.Encoding]::UTF8.GetString($bytes)
if ($u -match "Ã©|Ã¨|Ã |Ã€") {
    Write-Host "  ERREUR : double-encodage dans AppHeader.tsx" -ForegroundColor Red
} else {
    Write-Host "  OK : AppHeader.tsx UTF-8 propre" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Fix applique ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "  npm run build" -ForegroundColor Yellow
Write-Host "  git add src/components/AppHeader.tsx src/index.css" -ForegroundColor Yellow
Write-Host "  git commit -m `"fix(header): responsive mobile - community icon-only, logo no-shrink, hide admin badge`"" -ForegroundColor Yellow
Write-Host "  git push origin dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test : ouvre le preview dev sur mobile (ou DevTools responsive ~390px)." -ForegroundColor Yellow
Write-Host "       Le header ne doit plus se chevaucher. Communaute = icone boussole." -ForegroundColor Yellow
Write-Host ""
