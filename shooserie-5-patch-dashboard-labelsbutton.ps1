# ============================================================
#  Shooserie - Patch Dashboard.tsx : insertion LabelsButton
#  - import si pas present
#  - <LabelsButton variant="chip" showLabel /> apres <Link to="/messages">...</Link>
#  - idempotent : si deja insere, ne refait pas
# ============================================================

$ErrorActionPreference = "Stop"

function Read-FileUtf8 {
    param([string]$Path)
    [System.IO.File]::ReadAllText((Join-Path (Get-Location).Path $Path), [System.Text.Encoding]::UTF8)
}
function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $Path), $Content, (New-Object System.Text.UTF8Encoding $false))
}

$dashPath = "src/pages/Dashboard.tsx"
if (-not (Test-Path $dashPath)) {
    Write-Host "ERREUR : $dashPath introuvable" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Patch Dashboard.tsx : LabelsButton apres le lien Messages ===" -ForegroundColor Cyan

$dash = Read-FileUtf8 $dashPath
$dash = $dash -replace "\r?\n", "`r`n"

# Backup
$backupPath = "$dashPath.bak"
[System.IO.File]::Copy((Join-Path (Get-Location).Path $dashPath), (Join-Path (Get-Location).Path $backupPath), $true)
Write-Host "  Backup -> $backupPath" -ForegroundColor DarkGray

# ============================================================
# 1. Verifier qu'on n'a pas deja insere
# ============================================================
if ($dash -match "<LabelsButton") {
    Write-Host "  i  <LabelsButton ... /> deja present dans le Dashboard, rien a faire." -ForegroundColor Yellow
    exit 0
}

# ============================================================
# 2. Ajouter l'import en haut du fichier
# ============================================================
if ($dash -notmatch "from\s+['""]@/components/LabelsButton['""]") {
    # On insere apres le dernier import du fichier (premiere occurrence d'une ligne vide apres bloc d'imports)
    $lines = $dash -split "`r`n"
    $lastImportIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*import\s") {
            $lastImportIdx = $i
        }
    }
    if ($lastImportIdx -ge 0) {
        $importLine = "import { LabelsButton } from '@/components/LabelsButton'"
        $before = $lines[0..$lastImportIdx]
        $after = if ($lastImportIdx + 1 -lt $lines.Count) { $lines[($lastImportIdx + 1)..($lines.Count - 1)] } else { @() }
        $newLines = @($before) + @($importLine) + @($after)
        $dash = $newLines -join "`r`n"
        Write-Host "  +  Import ajoute apres ligne $($lastImportIdx + 1)" -ForegroundColor Green
    } else {
        Write-Host "WARN  Aucune ligne d'import trouvee" -ForegroundColor Yellow
    }
}

# ============================================================
# 3. Inserer <LabelsButton ... /> apres </Link> qui ferme <Link to="/messages">...</Link>
# ============================================================
$lines = $dash -split "`r`n"
$messagesLinkStart = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match 'to=["'']/messages["'']') {
        $messagesLinkStart = $i
        break
    }
}

if ($messagesLinkStart -lt 0) {
    Write-Host "ERREUR : impossible de trouver 'to=`"/messages`"' dans Dashboard.tsx" -ForegroundColor Red
    Write-Host "         Reverte au backup ou inserer manuellement." -ForegroundColor Yellow
    exit 1
}

Write-Host "  Bloc <Link to=`"/messages`"> trouve a la ligne $($messagesLinkStart + 1)" -ForegroundColor DarkGray

# Trouve le prochain </Link> a partir de cette position
$closingIdx = -1
for ($j = $messagesLinkStart; $j -lt $lines.Count; $j++) {
    if ($lines[$j] -match "</Link>") {
        $closingIdx = $j
        break
    }
}

# Edge case : peut-etre que le Link est auto-ferme (<Link ... />)
$isSelfClosing = $false
if ($closingIdx -lt 0) {
    for ($j = $messagesLinkStart; $j -lt [Math]::Min($messagesLinkStart + 30, $lines.Count); $j++) {
        if ($lines[$j] -match "/>\s*$") {
            $closingIdx = $j
            $isSelfClosing = $true
            break
        }
    }
}

if ($closingIdx -lt 0) {
    Write-Host "ERREUR : impossible de trouver la fermeture du <Link to=`"/messages`">" -ForegroundColor Red
    exit 1
}

Write-Host "  Fermeture du Link messages a la ligne $($closingIdx + 1) $(if ($isSelfClosing) { '(auto-fermee)' } else { '(</Link>)' })" -ForegroundColor DarkGray

# Determine l'indentation a utiliser (meme que la ligne de fermeture)
$indent = ""
if ($lines[$closingIdx] -match "^(\s+)") {
    $indent = $matches[1]
    # Si la fermeture est </Link> et que l'indent est typique d'un enfant, on remonte d'un cran
    # pour matcher l'ouverture <Link
    if (-not $isSelfClosing -and $lines[$messagesLinkStart] -match "^(\s+)") {
        $indent = $matches[1]
    }
}

$newJsx = "$indent<LabelsButton variant=`"chip`" showLabel />"

$before = $lines[0..$closingIdx]
$after = if ($closingIdx + 1 -lt $lines.Count) { $lines[($closingIdx + 1)..($lines.Count - 1)] } else { @() }
$newLines = @($before) + @($newJsx) + @($after)
$dash = $newLines -join "`r`n"
Write-Host "  +  <LabelsButton variant=`"chip`" showLabel /> insere ligne $($closingIdx + 2)" -ForegroundColor Green

Write-FileUtf8NoBom -Path $dashPath -Content $dash

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Select-String -Path $dashPath -Pattern "LabelsButton" |
    ForEach-Object { "  L$($_.LineNumber) : $($_.Line.Trim())" }

Write-Host ""
Write-Host "=== Patch termine ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Lance maintenant :" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor Yellow
Write-Host ""
Write-Host "Si vert, push :" -ForegroundColor Yellow
Write-Host "  git add -A" -ForegroundColor Yellow
Write-Host "  git commit -m `"feat(labels): icone imprimante dans nav Dashboard vers /labels`"" -ForegroundColor Yellow
Write-Host "  git push origin dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "En cas de souci, le backup est dispo dans $backupPath" -ForegroundColor DarkGray
Write-Host ""
