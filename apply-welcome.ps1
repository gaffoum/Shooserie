# =====================================================
# Apply Welcome Header — Action #1
# =====================================================
# Cree src/components/WelcomeHeader.tsx
# Modifie src/pages/Dashboard.tsx (import + composant)
# =====================================================

$ErrorActionPreference = "Stop"
Write-Host "=== Apply Welcome Header ===" -ForegroundColor Cyan

# === 1. Creer le composant WelcomeHeader.tsx ===
$componentDir = "src\components"
$componentPath = "$componentDir\WelcomeHeader.tsx"

if (-not (Test-Path $componentDir)) {
    New-Item -ItemType Directory -Force -Path $componentDir | Out-Null
}

$componentContent = @'
/**
 * WelcomeHeader — bandeau "Salut [pseudo] !" en haut du Dashboard.
 */
import { useAuth } from '../contexts/AuthContext'
import { useMyProfile } from '../lib/queries'

export function WelcomeHeader() {
  const { user } = useAuth()
  const { data: profile } = useMyProfile()

  const displayName =
    profile?.display_name && profile.display_name.trim().length > 0
      ? profile.display_name
      : user?.email?.split('@')[0] ?? null

  if (!displayName) return null

  return (
    <div style={wrapperStyle}>
      <h1 style={titleStyle}>
        Salut <span style={nameStyle}>{displayName}</span> !
      </h1>
    </div>
  )
}

const wrapperStyle: React.CSSProperties = {
  marginBottom: 24,
}

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 700,
  margin: 0,
  color: '#0A0A0A',
  fontFamily: "'Outfit', sans-serif",
  letterSpacing: '-0.02em',
}

const nameStyle: React.CSSProperties = {
  color: '#CE1141',
}
'@

[System.IO.File]::WriteAllText(
    (Resolve-Path -Path "." -ErrorAction Stop).Path + "\$componentPath",
    $componentContent,
    [System.Text.UTF8Encoding]::new($false)
)
Write-Host "OK 1/3 - WelcomeHeader.tsx cree" -ForegroundColor Green


# === 2. Ajouter l'import dans Dashboard.tsx ===
$dashboardPath = "src\pages\Dashboard.tsx"
if (-not (Test-Path $dashboardPath)) {
    Write-Host "ERREUR Dashboard.tsx introuvable" -ForegroundColor Red
    exit 1
}

$content = Get-Content $dashboardPath -Raw

if ($content -match "from '\.\./components/WelcomeHeader'") {
    Write-Host "OK 2/3 - Import deja present" -ForegroundColor Yellow
} else {
    # Insere apres le dernier import du fichier
    $importLine = "import { WelcomeHeader } from '../components/WelcomeHeader'"
    $content = $content -replace "(import [^\r\n]+from [^\r\n]+\r?\n)(?!import)", "`$1$importLine`r`n"
    Write-Host "OK 2/3 - Import ajoute" -ForegroundColor Green
}


# === 3. Inserer <WelcomeHeader /> dans le JSX ===
if ($content -match "<WelcomeHeader\s*/>") {
    Write-Host "OK 3/3 - Composant deja place" -ForegroundColor Yellow
} else {
    # Strategie : inserer juste apres l'ouverture du premier element JSX dans return ( ... )
    $pattern = "(return\s*\(\s*<[^/>]+>)"
    if ($content -match $pattern) {
        $content = $content -replace $pattern, "`$1`r`n      <WelcomeHeader />"
        Write-Host "OK 3/3 - Composant insere au top du JSX" -ForegroundColor Green
    } else {
        Write-Host "ATTENTION 3/3 - Pas pu trouver ou inserer, fais le manuellement" -ForegroundColor Yellow
    }
}

# Sauvegarder Dashboard.tsx
Set-Content -Path $dashboardPath -Value $content -NoNewline
Write-Host ""

# === 4. Verification finale ===
Write-Host "Verification..." -ForegroundColor Cyan
$check1 = Test-Path "src\components\WelcomeHeader.tsx"
$check2 = (Get-Content "src\pages\Dashboard.tsx" -Raw) -match "WelcomeHeader"

if ($check1 -and $check2) {
    Write-Host "TOUT EST OK !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Maintenant :" -ForegroundColor Cyan
    Write-Host "  git branch        # verifie * dev"
    Write-Host "  git add ."
    Write-Host "  git commit -m 'feat: welcome header with pseudo on dashboard'"
    Write-Host "  git push origin dev"
} else {
    Write-Host "ERREUR : check1=$check1 check2=$check2" -ForegroundColor Red
}