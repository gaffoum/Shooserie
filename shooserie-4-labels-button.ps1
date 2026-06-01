# ============================================================
#  Shooserie - LabelsButton (icone imprimante vers /labels)
#
#  Strategie en 2 temps :
#  1) Auto-discovery : grep "À vendre" / "Marché" / "Messages" pour
#     trouver le fichier qui rend ces tabs/etiquettes
#  2) Creation du composant LabelsButton.tsx (reutilisable)
#  3) Affichage des emplacements trouves pour insertion manuelle
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $Path), $Content, (New-Object System.Text.UTF8Encoding $false))
}

Write-Host ""
Write-Host "=== Script LabelsButton ===" -ForegroundColor Cyan

# ============================================================
# 1. src/components/LabelsButton.tsx
# ============================================================
$labelsBtnTsx = @'
/**
 * LabelsButton — icone imprimante qui mene a /labels.
 * Conçue pour s'inserer dans une rangee de tabs / etiquettes (paire a vendre, marche, messages...)
 *
 * Usage :
 *   <LabelsButton />                          // version icone seule (compact)
 *   <LabelsButton showLabel />                // avec libelle "Étiquettes"
 *   <LabelsButton variant="chip" showLabel /> // matche le style chip/etiquette
 */
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'

interface LabelsButtonProps {
  /** Affiche le libelle "Étiquettes" a cote de l'icone. */
  showLabel?: boolean
  /** Style : 'icon' (cercle simple) ou 'chip' (pilule pour matcher des tabs). */
  variant?: 'icon' | 'chip'
  /** Titre custom au survol. */
  title?: string
}

export function LabelsButton({
  showLabel = false,
  variant = 'icon',
  title = 'Imprimer mes étiquettes',
}: LabelsButtonProps) {
  if (variant === 'chip') {
    return (
      <Link to="/labels" style={chipStyle} title={title} aria-label={title}>
        <PrinterIcon />
        {showLabel && <span style={chipLabelStyle}>Étiquettes</span>}
      </Link>
    )
  }
  return (
    <Link to="/labels" style={iconStyle} title={title} aria-label={title}>
      <PrinterIcon />
      {showLabel && <span style={iconLabelStyle}>Étiquettes</span>}
    </Link>
  )
}

function PrinterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9"></polyline>
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
      <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
  )
}

const iconStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  width: 36,
  minWidth: 36,
  height: 36,
  borderRadius: '50%',
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  color: '#0A0A0A',
  textDecoration: 'none',
  justifyContent: 'center',
  transition: 'border-color 120ms, background 120ms',
}

const iconLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'Outfit', sans-serif",
}

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 999,
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  color: '#0A0A0A',
  textDecoration: 'none',
  fontFamily: "'Outfit', sans-serif",
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  transition: 'border-color 120ms, background 120ms',
}

const chipLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
}
'@
Write-FileUtf8NoBom -Path "src/components/LabelsButton.tsx" -Content $labelsBtnTsx
Write-Host "  +  src/components/LabelsButton.tsx" -ForegroundColor Green

# ============================================================
# 2. Auto-discovery : ou se trouvent les onglets ?
# ============================================================
Write-Host ""
Write-Host "Recherche des fichiers qui contiennent 'paire a vendre / marche / messages' :" -ForegroundColor Cyan

$patterns = @(
    "paire.*vendre",   # "paire a vendre", "paires a vendre"
    "à vendre",
    "a vendre",
    "for sale",
    "marche",
    "marché",
    "marketplace",
    "messages"
)

$candidates = @{}

foreach ($p in $patterns) {
    $matches = Select-String -Path "src/**/*.tsx", "src/**/*.ts" -Pattern $p -CaseSensitive:$false -ErrorAction SilentlyContinue
    foreach ($m in $matches) {
        $file = $m.Path.Replace((Get-Location).Path, '.').Replace('\','/')
        if (-not $candidates.ContainsKey($file)) {
            $candidates[$file] = @()
        }
        $candidates[$file] += "L$($m.LineNumber) [$p] : $($m.Line.Trim())"
    }
}

if ($candidates.Count -eq 0) {
    Write-Host "  (aucun fichier trouve avec ces patterns)" -ForegroundColor Yellow
} else {
    foreach ($file in $candidates.Keys | Sort-Object) {
        Write-Host ""
        Write-Host "  > $file" -ForegroundColor White
        foreach ($line in ($candidates[$file] | Select-Object -First 5)) {
            Write-Host "    $line" -ForegroundColor DarkGray
        }
        if ($candidates[$file].Count -gt 5) {
            Write-Host "    ... ($($candidates[$file].Count - 5) autres lignes)" -ForegroundColor DarkGray
        }
    }
}

# ============================================================
# 3. Instructions d'insertion manuelle
# ============================================================
Write-Host ""
Write-Host "=== Insertion manuelle ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ouvre le fichier ou se trouvent les tabs/etiquettes (probablement Dashboard.tsx ou un composant CollectionTabs.tsx)" -ForegroundColor White
Write-Host ""
Write-Host "2. En haut du fichier, ajoute l'import :" -ForegroundColor White
Write-Host "   import { LabelsButton } from '@/components/LabelsButton'" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Dans le JSX, a cote des autres tabs (paire a vendre, marche, messages...) ajoute :" -ForegroundColor White
Write-Host '   <LabelsButton variant="chip" showLabel />' -ForegroundColor Yellow
Write-Host ""
Write-Host "   Ou bien la version compacte (icone seule) :" -ForegroundColor White
Write-Host '   <LabelsButton />' -ForegroundColor Yellow
Write-Host ""

# ============================================================
# Verifications
# ============================================================
Write-Host "=== Verifications ===" -ForegroundColor Cyan
if (Test-Path "src/components/LabelsButton.tsx") {
    Write-Host "  + src/components/LabelsButton.tsx cree" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Script termine ===" -ForegroundColor Cyan
Write-Host ""
