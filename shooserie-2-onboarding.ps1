# ============================================================
#  Shooserie - Onboarding inline (anti-churn activation)
#  - OnboardingHero       : CTA gros "Ajoute ta premiere paire"
#  - QuickAddSuggestions  : 3 modeles iconiques 1-clic
#  - OnboardingIfEmpty    : wrapper self-contained qui fetch le count
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $Path), $Content, (New-Object System.Text.UTF8Encoding $false))
}
function Read-FileUtf8 {
    param([string]$Path)
    [System.IO.File]::ReadAllText((Join-Path (Get-Location).Path $Path), [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "=== Script 2/3 : Onboarding ===" -ForegroundColor Cyan

# ============================================================
# 1. src/components/OnboardingHero.tsx
# ============================================================
$onboardingHeroTsx = @'
/**
 * OnboardingHero — affiche sur le Dashboard si l'utilisateur n'a aucune paire.
 * CTA gros et clair pour pousser a l'activation (cible des 49% churn d'activation).
 */
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'

export function OnboardingHero() {
  return (
    <div style={wrapperStyle}>
      <div style={contentStyle}>
        <div style={emojiStyle}>👟</div>
        <h2 style={titleStyle}>Bienvenue chez les sneakerheads</h2>
        <p style={subtitleStyle}>
          Ta collec t'attend. Ajoute ta première paire pour démarrer ton parcours.
        </p>
        <Link to="/sneakers/new" style={ctaStyle}>
          Ajouter ma première paire <span style={{ marginLeft: 6 }}>→</span>
        </Link>
        <p style={hintStyle}>Moins de 30 secondes ⏱️</p>
      </div>
    </div>
  )
}

const wrapperStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #0A0A0A 0%, #1F1F1F 100%)',
  borderRadius: 16,
  padding: '40px 24px',
  marginBottom: 24,
  textAlign: 'center',
  fontFamily: "'Outfit', sans-serif",
}
const contentStyle: CSSProperties = { maxWidth: 400, margin: '0 auto' }
const emojiStyle: CSSProperties = { fontSize: 48, marginBottom: 12 }
const titleStyle: CSSProperties = {
  fontSize: 24, fontWeight: 800, color: '#FFFFFF',
  margin: '0 0 8px', letterSpacing: '-0.01em',
}
const subtitleStyle: CSSProperties = {
  fontSize: 14, color: '#9CA3AF',
  margin: '0 0 24px', lineHeight: 1.5,
}
const ctaStyle: CSSProperties = {
  display: 'inline-block', background: '#CE1141', color: '#FFFFFF',
  fontSize: 15, fontWeight: 700, padding: '12px 24px',
  borderRadius: 999, textDecoration: 'none', letterSpacing: '0.01em',
}
const hintStyle: CSSProperties = { marginTop: 12, fontSize: 12, color: '#6B7280' }
'@
Write-FileUtf8NoBom -Path "src/components/OnboardingHero.tsx" -Content $onboardingHeroTsx
Write-Host "  +  src/components/OnboardingHero.tsx" -ForegroundColor Green

# ============================================================
# 2. src/components/QuickAddSuggestions.tsx
# ============================================================
$quickAddTsx = @'
/**
 * QuickAddSuggestions — 3 modeles iconiques 1-clic pour casser la friction d'ajout.
 * Affiche sur le Dashboard quand l'user n'a aucune paire (sous OnboardingHero).
 *
 * Strategie : pre-remplir le formulaire d'ajout via URL params (?brand=...&name=...).
 * Le composant SneakerForm peut gerer ces params pour pre-remplir, sinon l'user remplit
 * lui-meme (mais le CTA principal pointe deja sur le bon modele).
 */
import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'

interface QuickModel {
  brand: string
  name: string
  emoji: string
  description: string
}

const ICONIC_MODELS: QuickModel[] = [
  { brand: 'NIKE',   name: 'Air Force 1 Low White', emoji: '👟', description: 'Le classique absolu, va avec tout.' },
  { brand: 'NIKE',   name: 'Dunk Low Panda',        emoji: '🐼', description: 'Noir & blanc, jamais ringard.' },
  { brand: 'ADIDAS', name: 'Stan Smith',            emoji: '🎾', description: 'Minimaliste, intemporel.' },
]

export function QuickAddSuggestions() {
  return (
    <section style={sectionStyle}>
      <h3 style={titleStyle}>OU CHOISIS UN CLASSIQUE</h3>
      <div style={gridStyle}>
        {ICONIC_MODELS.map((m) => {
          const params = new URLSearchParams({ brand: m.brand, name: m.name }).toString()
          return (
            <Link key={m.name} to={`/sneakers/new?${params}`} style={cardStyle}>
              <div style={emojiStyle}>{m.emoji}</div>
              <div style={brandStyle}>{m.brand}</div>
              <div style={nameStyle}>{m.name}</div>
              <div style={descStyle}>{m.description}</div>
              <div style={addBtnStyle}>+ Ajouter</div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

const sectionStyle: CSSProperties = { marginBottom: 32, fontFamily: "'Outfit', sans-serif" }
const titleStyle: CSSProperties = {
  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#6B7280',
  textAlign: 'center', margin: '0 0 16px',
}
const gridStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12,
}
const cardStyle: CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 12,
  padding: 16, textDecoration: 'none', color: 'inherit',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  textAlign: 'center', transition: 'border-color 120ms', cursor: 'pointer',
}
const emojiStyle: CSSProperties = { fontSize: 32, marginBottom: 8 }
const brandStyle: CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
  color: '#6B7280', marginBottom: 2,
}
const nameStyle: CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#0A0A0A',
  marginBottom: 6, lineHeight: 1.2,
}
const descStyle: CSSProperties = {
  fontSize: 11, color: '#6B7280', marginBottom: 12, lineHeight: 1.4, flex: 1,
}
const addBtnStyle: CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#CE1141',
  padding: '6px 14px', border: '1px solid #CE1141',
  borderRadius: 999, background: '#FFFFFF',
}
'@
Write-FileUtf8NoBom -Path "src/components/QuickAddSuggestions.tsx" -Content $quickAddTsx
Write-Host "  +  src/components/QuickAddSuggestions.tsx" -ForegroundColor Green

# ============================================================
# 3. src/components/OnboardingIfEmpty.tsx — wrapper self-contained
# ============================================================
$onboardingIfEmptyTsx = @'
/**
 * OnboardingIfEmpty — wrapper qui affiche OnboardingHero + QuickAddSuggestions
 * uniquement si l'utilisateur courant n'a aucune paire.
 *
 * Self-contained : fait sa propre query Supabase (count head) pour eviter de
 * polluer Dashboard.tsx avec un nouvel etat. Cout : 1 requete count tres rapide.
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { OnboardingHero } from './OnboardingHero'
import { QuickAddSuggestions } from './QuickAddSuggestions'

function useMyPairCount() {
  return useQuery({
    queryKey: ['my-pair-count-onboarding'],
    queryFn: async (): Promise<number | null> => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) return null
      const { count, error } = await supabase
        .from('sneakers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (error) throw error
      return count ?? 0
    },
    staleTime: 30 * 1000,
  })
}

export function OnboardingIfEmpty() {
  const { data: count, isLoading } = useMyPairCount()
  if (isLoading) return null
  if (count === null || count === undefined) return null
  if (count > 0) return null
  return (
    <>
      <OnboardingHero />
      <QuickAddSuggestions />
    </>
  )
}
'@
Write-FileUtf8NoBom -Path "src/components/OnboardingIfEmpty.tsx" -Content $onboardingIfEmptyTsx
Write-Host "  +  src/components/OnboardingIfEmpty.tsx" -ForegroundColor Green

# ============================================================
# 4. Patch Dashboard.tsx : import + render apres WelcomeHeader
# ============================================================
$dashPath = "src/pages/Dashboard.tsx"
$dash = Read-FileUtf8 $dashPath
$dash = $dash -replace "\r?\n", "`r`n"

# Import
if ($dash -notmatch "import \{ OnboardingIfEmpty \}") {
    # Ancre defensive : on cherche n'importe quel import de '@/components/'
    $anchor = "import { TopWornSneakers } from '@/components/TopWornSneakers'"
    if ($dash.Contains($anchor)) {
        $dash = $dash.Replace($anchor, "import { OnboardingIfEmpty } from '@/components/OnboardingIfEmpty'`r`n$anchor")
        Write-Host "  +  Import OnboardingIfEmpty ajoute" -ForegroundColor Green
    } else {
        # Fallback : on cherche WelcomeHeader
        $anchor2 = "import { WelcomeHeader }"
        if ($dash -match [regex]::Escape($anchor2)) {
            $dash = [regex]::Replace($dash, [regex]::Escape($anchor2), "import { OnboardingIfEmpty } from '@/components/OnboardingIfEmpty'`r`n$anchor2", 1)
            Write-Host "  +  Import OnboardingIfEmpty ajoute (via fallback WelcomeHeader)" -ForegroundColor Green
        } else {
            Write-Host "WARN  Aucune ancre import trouvee dans Dashboard.tsx" -ForegroundColor Yellow
        }
    }
}

# JSX : insertion apres <WelcomeHeader />
if ($dash -notmatch "<OnboardingIfEmpty\s*/>") {
    $lines = $dash -split "`r`n"
    $idx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "<WelcomeHeader\s*/>") {
            $idx = $i
            break
        }
    }
    if ($idx -ge 0) {
        Write-Host "  Ligne <WelcomeHeader /> trouvee a L$($idx + 1)" -ForegroundColor DarkGray
        $insertLines = @(
            '        <OnboardingIfEmpty />'
        )
        $before = $lines[0..$idx]
        $after = if ($idx + 1 -lt $lines.Count) { $lines[($idx + 1)..($lines.Count - 1)] } else { @() }
        $newLines = @($before) + @($insertLines) + @($after)
        $dash = ($newLines -join "`r`n")
        Write-Host "  +  <OnboardingIfEmpty /> insere apres <WelcomeHeader />" -ForegroundColor Green
    } else {
        Write-Host "WARN  <WelcomeHeader /> non trouve dans Dashboard.tsx" -ForegroundColor Yellow
        Write-Host "      Ajoute manuellement <OnboardingIfEmpty /> en haut du dashboard" -ForegroundColor Yellow
    }
}

Write-FileUtf8NoBom -Path $dashPath -Content $dash

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Get-ChildItem src/components/OnboardingHero.tsx, src/components/QuickAddSuggestions.tsx, src/components/OnboardingIfEmpty.tsx -ErrorAction SilentlyContinue |
    ForEach-Object { "  + $($_.FullName.Replace((Get-Location).Path, '.').Replace('\','/'))" }
Select-String -Path $dashPath -Pattern "OnboardingIfEmpty" |
    ForEach-Object { "  Dashboard L$($_.LineNumber) : $($_.Line.Trim())" }

Write-Host ""
Write-Host "=== Script 2/3 termine ===" -ForegroundColor Cyan
Write-Host ""
