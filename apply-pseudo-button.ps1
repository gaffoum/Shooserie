# =====================================================
# Apply Pseudo on Profile Button — Action #2
# =====================================================
# Remplace l'email par le pseudo dans le bouton profil (AppHeader.tsx)
# Fallback sur l'email si le pseudo n'est pas defini
# =====================================================

$ErrorActionPreference = "Stop"
Write-Host "=== Apply Pseudo Button ===" -ForegroundColor Cyan

$headerPath = "src\components\AppHeader.tsx"
if (-not (Test-Path $headerPath)) {
    Write-Host "ERREUR AppHeader.tsx introuvable" -ForegroundColor Red
    exit 1
}

$content = Get-Content $headerPath -Raw

# === 1. Ajouter useMyProfile a l'import depuis @/lib/queries ===
if ($content -match "useMyProfile") {
    Write-Host "OK 1/3 - useMyProfile deja importe" -ForegroundColor Yellow
} else {
    # Insere useMyProfile dans la liste des imports
    $content = $content -replace "(import \{ [^}]*?)(\} from '@/lib/queries')", "`$1, useMyProfile`$2"
    Write-Host "OK 1/3 - useMyProfile ajoute a l'import" -ForegroundColor Green
}

# === 2. Ajouter const { data: profile } = useMyProfile() ===
if ($content -match "const \{ data: profile \} = useMyProfile") {
    Write-Host "OK 2/3 - profile deja recupere" -ForegroundColor Yellow
} else {
    # Ajoute juste apres const isAdmin = ...
    $content = $content -replace "(const isAdmin = user\?\.email === ADMIN_EMAIL)", "`$1`r`n  const { data: profile } = useMyProfile()"
    Write-Host "OK 2/3 - profile ajoute" -ForegroundColor Green
}

# === 3. Remplacer {user?.email} (standalone) par {profile?.display_name ?? user?.email} ===
# On utilise un negative lookahead pour ne PAS toucher title={user?.email ?? ''}
if ($content -match "profile\?\.display_name \?\? user\?\.email") {
    Write-Host "OK 3/3 - Affichage deja modifie" -ForegroundColor Yellow
} else {
    $content = $content -replace '\{user\?\.email\}(?!\s*\?\?)', '{profile?.display_name ?? user?.email}'
    Write-Host "OK 3/3 - Affichage modifie (email -> pseudo)" -ForegroundColor Green
}

# Sauvegarder
Set-Content -Path $headerPath -Value $content -NoNewline
Write-Host ""

# === Verification finale ===
Write-Host "Verification..." -ForegroundColor Cyan
$check1 = (Get-Content $headerPath -Raw) -match "useMyProfile"
$check2 = (Get-Content $headerPath -Raw) -match "const \{ data: profile \} = useMyProfile"
$check3 = (Get-Content $headerPath -Raw) -match "profile\?\.display_name \?\? user\?\.email"

if ($check1 -and $check2 -and $check3) {
    Write-Host "TOUT EST OK !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Maintenant :" -ForegroundColor Cyan
    Write-Host "  git add ."
    Write-Host "  git commit -m 'feat: show pseudo instead of email on profile button'"
    Write-Host "  git push origin dev"
} else {
    Write-Host "ERREUR : check1=$check1 check2=$check2 check3=$check3" -ForegroundColor Red
    Write-Host "Lance Select-String pour voir l'etat actuel :" -ForegroundColor Yellow
    Write-Host "  Select-String -Path '$headerPath' -Pattern 'user\?\.email|profile\?\.display_name'"
}