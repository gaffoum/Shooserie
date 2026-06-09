# ============================================================================
#  lot1-labels-gating.ps1
#  Lot 1 (front only) :
#   - Telechargement PDF gratuit reserve a l'admin (ADMIN_EMAIL)
#   - Les non-admin voient l'apercu de la planche COMPLETE (toutes les paires
#     selectionnees) + le CTA commande existant (prix inchange)
#  Aucun changement de prix / serveur (ca, c'est le Lot 2).
#  Remplacements cibles + verifies (stoppe si une ancre manque). EOL-safe.
#  A lancer depuis la RACINE du repo Shooserie.
# ============================================================================
$ErrorActionPreference = 'Stop'

function Read-FileUtf8([string]$Path) {
  return [System.IO.File]::ReadAllText($Path, (New-Object System.Text.UTF8Encoding($false)))
}
function Write-FileUtf8NoBom([string]$Path, [string]$Content) {
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $enc)
}
function Replace-Once([string]$text, [string]$old, [string]$new, [string]$label) {
  $i = $text.IndexOf($old, [System.StringComparison]::Ordinal)
  if ($i -lt 0) { throw "ANCRE INTROUVABLE: $label" }
  $j = $text.IndexOf($old, $i + 1, [System.StringComparison]::Ordinal)
  if ($j -ge 0) { throw "ANCRE NON UNIQUE: $label" }
  Write-Host "  ok: $label" -ForegroundColor DarkGray
  return $text.Replace($old, $new)
}

$path = 'src/pages/Labels.tsx'
if (-not (Test-Path $path)) {
  Write-Host "ERREUR : lance depuis la racine du repo (src/pages/Labels.tsx introuvable)." -ForegroundColor Red
  exit 1
}

$raw = Read-FileUtf8 $path
$hadCRLF = $raw.Contains("`r`n")
$t = $raw -replace "`r`n", "`n"   # normalise en LF pour le matching

Write-Host "== Remplacements ==" -ForegroundColor Cyan

# --- R1 : imports (apres l'import de StickerPreview) ---
$t = Replace-Once $t @'
import { StickerPreview } from '../components/StickerPreview'
'@ @'
import { StickerPreview } from '../components/StickerPreview'
import { useAuth } from '../contexts/AuthContext'
import { ADMIN_EMAIL } from '../lib/queries'
'@ 'R1 imports'

# --- R2 : calcul isAdmin (apres const sneakers) ---
$t = Replace-Once $t @'
  const sneakers = sneakersQ.data ?? []
'@ @'
  const sneakers = sneakersQ.data ?? []
  const { session } = useAuth()
  const isAdmin = session?.user.email === ADMIN_EMAIL
'@ 'R2 isAdmin'

# --- R3 : apercu planche complete (toutes les paires selectionnees) ---
$t = Replace-Once $t @'
            {selectedSneakers[0] || filtered[0] ? (
              <StickerPreview
                sneaker={selectedSneakers[0] || filtered[0]}
                options={options}
                scale={1.4}
              />
            ) : (
'@ @'
            {selectedSneakers.length > 0 ? (
              <div style={sheetGridStyle}>
                {selectedSneakers.map((s) => (
                  <StickerPreview key={s.id} sneaker={s} options={options} scale={1.1} />
                ))}
              </div>
            ) : filtered[0] ? (
              <StickerPreview sneaker={filtered[0]} options={options} scale={1.4} />
            ) : (
'@ 'R3 apercu planche'

# --- R4 : style de la grille planche (apres previewWrapStyle) ---
$t = Replace-Once $t @'
const previewWrapStyle: CSSProperties = {
  display: 'flex', justifyContent: 'center', padding: 16,
  background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB',
}
'@ @'
const previewWrapStyle: CSSProperties = {
  display: 'flex', justifyContent: 'center', padding: 16,
  background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB',
}
const sheetGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  width: '100%',
}
'@ 'R4 sheetGridStyle'

# --- R5 : ouverture du wrap admin autour du bouton telechargement ---
$t = Replace-Once $t @'
        <div style={ctaWrapStyle}>
          <button
            type="button"
            onClick={handleGenerate}
'@ @'
        <div style={ctaWrapStyle}>
          {isAdmin && (
          <button
            type="button"
            onClick={handleGenerate}
'@ 'R5 wrap admin (open)'

# --- R6 : fermeture wrap admin + ouverture wrap non-admin (bouton commande) ---
$t = Replace-Once $t @'
          </button>

          <button
            type="button"
            onClick={() => {
'@ @'
          </button>
          )}

          {!isAdmin && (
          <button
            type="button"
            onClick={() => {
'@ 'R6 wrap commande (open)'

# --- R7 : fermeture wrap non-admin avant le hint ---
$t = Replace-Once $t @'
          </button>
          <p style={hintStyle}>
'@ @'
          </button>
          )}
          <p style={hintStyle}>
'@ 'R7 wrap commande (close)'

# --- restaure l'EOL d'origine + ecrit ---
if ($hadCRLF) { $t = $t -replace "`n", "`r`n" }
Write-FileUtf8NoBom -Path $path -Content $t
Get-ChildItem -Path $path -File | Unblock-File

Write-Host ""
Write-Host "OK - Labels.tsx mis a jour (Lot 1)." -ForegroundColor Green
Write-Host ""
Write-Host "Etapes :" -ForegroundColor Yellow
Write-Host "  git branch                 # * dev"
Write-Host "  git add -A"
Write-Host "  git commit -m ""feat(labels): download admin-only + apercu planche complete (lot 1)"""
Write-Host "  git push origin dev"
Write-Host ""
Write-Host "Test (apres Vercel READY, navigation privee) :" -ForegroundColor Yellow
Write-Host "  - Connecte en gaffoum@gmail.com  -> bouton Telecharger visible"
Write-Host "  - Connecte en gaffoum+test1@gmail.com (Titi) -> PAS de download,"
Write-Host "    apercu de toutes les paires + CTA Commander."
