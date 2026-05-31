# ============================================================
#  Fix-up insertion JSX par lignes
#  Plus robuste : trouve la ligne ancre, insere apres.
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $Path), $Content, (New-Object System.Text.UTF8Encoding $false))
}
function Read-FileUtf8 {
    param([string]$Path)
    [System.IO.File]::ReadAllText((Join-Path (Get-Location).Path $Path), [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "=== Fix-up : insertions JSX par lignes ===" -ForegroundColor Cyan

# ============================================================
# 1. WelcomeHeader.tsx : insertion apres </h1>
# ============================================================
$wlPath = "src/components/WelcomeHeader.tsx"
$wl = Read-FileUtf8 $wlPath

if ($wl -match "BadgeDisplay code=\{badgeQ") {
    Write-Host "  =  JSX badge deja present dans WelcomeHeader" -ForegroundColor DarkGray
} else {
    $lines = $wl -split "\r?\n"
    $idx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*</h1>\s*$") {
            $idx = $i
            break
        }
    }

    if ($idx -lt 0) {
        Write-Host "ERREUR  Ligne </h1> non trouvee dans WelcomeHeader" -ForegroundColor Red
    } else {
        Write-Host "  Ligne </h1> trouvee a L$($idx + 1)" -ForegroundColor DarkGray

        $insertLines = @(
            '      {badgeQ.data && (',
            '        <div style={{ marginTop: 16 }}>',
            '          <BadgeDisplay code={badgeQ.data.badge.code} size="lg" showLabel longLabel />',
            '          {badgeQ.data.facets.length > 0 && (',
            '            <div style={{ marginTop: 10 }}>',
            '              <FacetsList facets={badgeQ.data.facets} />',
            '            </div>',
            '          )}',
            '          <BadgeProgressBar progress={badgeQ.data.progress} />',
            '        </div>',
            '      )}'
        )

        $before = if ($idx -ge 0) { $lines[0..$idx] } else { @() }
        $after = if ($idx + 1 -lt $lines.Count) { $lines[($idx + 1)..($lines.Count - 1)] } else { @() }
        $newLines = @($before) + @($insertLines) + @($after)
        $wl = ($newLines -join "`r`n")

        Write-FileUtf8NoBom -Path $wlPath -Content $wl
        Write-Host "  +  WelcomeHeader : JSX badge insere apres L$($idx + 1)" -ForegroundColor Green
    }
}

# ============================================================
# 2. UserProfile.tsx : insertion apres </p> (qui suit le toLocaleDateString fr-FR)
# ============================================================
$upPath = "src/pages/UserProfile.tsx"
$up = Read-FileUtf8 $upPath

if ($up -match "BadgeDisplay code=\{badgeQ") {
    Write-Host "  =  JSX badge deja present dans UserProfile" -ForegroundColor DarkGray
} else {
    $lines = $up -split "\r?\n"

    # Trouver la ligne avec 'fr-FR'
    $frIdx = -1
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "'fr-FR'") {
            $frIdx = $i
            break
        }
    }

    if ($frIdx -lt 0) {
        Write-Host "ERREUR  Ligne avec 'fr-FR' non trouvee dans UserProfile" -ForegroundColor Red
    } else {
        # A partir de la, trouver le prochain </p>
        $pIdx = -1
        for ($i = $frIdx; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^\s*</p>\s*$") {
                $pIdx = $i
                break
            }
        }

        if ($pIdx -lt 0) {
            Write-Host "ERREUR  </p> apres 'fr-FR' non trouve dans UserProfile" -ForegroundColor Red
        } else {
            Write-Host "  Ligne </p> trouvee a L$($pIdx + 1)" -ForegroundColor DarkGray

            $insertLines = @(
                '            {badgeQ.data && (',
                '              <div style={{ marginTop: 12 }}>',
                '                <BadgeDisplay code={badgeQ.data.badge.code} size="md" showLabel longLabel />',
                '                {badgeQ.data.facets.length > 0 && (',
                '                  <div style={{ marginTop: 8 }}>',
                '                    <FacetsList facets={badgeQ.data.facets} />',
                '                  </div>',
                '                )}',
                '              </div>',
                '            )}'
            )

            $before = $lines[0..$pIdx]
            $after = if ($pIdx + 1 -lt $lines.Count) { $lines[($pIdx + 1)..($lines.Count - 1)] } else { @() }
            $newLines = @($before) + @($insertLines) + @($after)
            $up = ($newLines -join "`r`n")

            Write-FileUtf8NoBom -Path $upPath -Content $up
            Write-Host "  +  UserProfile : JSX badge insere apres L$($pIdx + 1)" -ForegroundColor Green
        }
    }
}

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Select-String -Path $wlPath -Pattern "BadgeDisplay|FacetsList|BadgeProgressBar" |
    ForEach-Object { "  WL L$($_.LineNumber) : $($_.Line.Trim())" }
Write-Host ""
Select-String -Path $upPath -Pattern "BadgeDisplay|FacetsList" |
    ForEach-Object { "  UP L$($_.LineNumber) : $($_.Line.Trim())" }

Write-Host ""
Write-Host "=== Fix-up termine ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Suite :" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor White
Write-Host ""
