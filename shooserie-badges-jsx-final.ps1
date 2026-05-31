# ============================================================
#  Shooserie - Phase A+B : insertions JSX finales
#  1. WelcomeHeader.tsx : hook + badge complet (lg) + facets + progress
#  2. UserProfile.tsx   : hook + badge (md) + facets dans header card
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
Write-Host "=== Insertions JSX badges ===" -ForegroundColor Cyan

# ============================================================
# 1. WelcomeHeader.tsx
# ============================================================
$wlPath = "src/components/WelcomeHeader.tsx"
$wl = Read-FileUtf8 $wlPath
# Normalise EOL en CRLF pour matchs fiables
$wl = $wl -replace "\r?\n", "`r`n"

# 1a. Insert hook après useMyProfile
if ($wl -match "const badgeQ = useMyBadge\(\)") {
    Write-Host "  =  Hook useMyBadge deja insere dans WelcomeHeader" -ForegroundColor DarkGray
} else {
    $old = "  const { data: profile } = useMyProfile()"
    $new = "  const { data: profile } = useMyProfile()`r`n  const badgeQ = useMyBadge()"
    if ($wl.Contains($old)) {
        $wl = $wl.Replace($old, $new)
        Write-Host "  +  WelcomeHeader : hook useMyBadge insere" -ForegroundColor Green
    } else {
        Write-Host "ERREUR  Ancre useMyProfile non trouvee dans WelcomeHeader" -ForegroundColor Red
    }
}

# 1b. Insert JSX block apres </h1>
if ($wl -match "BadgeDisplay code=\{badgeQ\.data\.badge\.code\}") {
    Write-Host "  =  JSX badge deja present dans WelcomeHeader" -ForegroundColor DarkGray
} else {
    $oldJsx = @"
      <h1 style={titleStyle}>
        Salut <span style={nameStyle}>{displayName}</span> !
      </h1>
    </div>
"@
    $newJsx = @"
      <h1 style={titleStyle}>
        Salut <span style={nameStyle}>{displayName}</span> !
      </h1>
      {badgeQ.data && (
        <div style={{ marginTop: 16 }}>
          <BadgeDisplay code={badgeQ.data.badge.code} size="lg" showLabel longLabel />
          {badgeQ.data.facets.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <FacetsList facets={badgeQ.data.facets} />
            </div>
          )}
          <BadgeProgressBar progress={badgeQ.data.progress} />
        </div>
      )}
    </div>
"@
    if ($wl.Contains($oldJsx)) {
        $wl = $wl.Replace($oldJsx, $newJsx)
        Write-Host "  +  WelcomeHeader : JSX badge complet insere" -ForegroundColor Green
    } else {
        Write-Host "ERREUR  Ancre JSX </h1></div> non trouvee dans WelcomeHeader" -ForegroundColor Red
        Write-Host "        Verifie que le contenu CRLF/LF du fichier matche" -ForegroundColor Yellow
    }
}

Write-FileUtf8NoBom -Path $wlPath -Content $wl

# ============================================================
# 2. UserProfile.tsx
# ============================================================
$upPath = "src/pages/UserProfile.tsx"
$up = Read-FileUtf8 $upPath
$up = $up -replace "\r?\n", "`r`n"

# 2a. Insert hook après sneakersQ
if ($up -match "const badgeQ = useUserBadge") {
    Write-Host "  =  Hook useUserBadge deja insere dans UserProfile" -ForegroundColor DarkGray
} else {
    $old = "  const sneakersQ = useUserSneakers(profile?.id, tab === 'for-sale')"
    $new = "  const sneakersQ = useUserSneakers(profile?.id, tab === 'for-sale')`r`n  const badgeQ = useUserBadge(`r`n    profile?.collection_public ? profile.id : undefined,`r`n  )"
    if ($up.Contains($old)) {
        $up = $up.Replace($old, $new)
        Write-Host "  +  UserProfile : hook useUserBadge insere" -ForegroundColor Green
    } else {
        Write-Host "ERREUR  Ancre sneakersQ non trouvee dans UserProfile" -ForegroundColor Red
    }
}

# 2b. Insert JSX dans le headerLeftStyle, après le </p> memberSinceStyle
if ($up -match "BadgeDisplay code=\{badgeQ\.data\.badge\.code\}") {
    Write-Host "  =  JSX badge deja present dans UserProfile" -ForegroundColor DarkGray
} else {
    $oldJsx = @"
              })}
            </p>
          </div>
          <div style={statsRowStyle}>
"@
    $newJsx = @"
              })}
            </p>
            {badgeQ.data && (
              <div style={{ marginTop: 12 }}>
                <BadgeDisplay code={badgeQ.data.badge.code} size="md" showLabel longLabel />
                {badgeQ.data.facets.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <FacetsList facets={badgeQ.data.facets} />
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={statsRowStyle}>
"@
    if ($up.Contains($oldJsx)) {
        $up = $up.Replace($oldJsx, $newJsx)
        Write-Host "  +  UserProfile : JSX badge insere dans header card" -ForegroundColor Green
    } else {
        Write-Host "ERREUR  Ancre headerLeft non trouvee dans UserProfile" -ForegroundColor Red
        Write-Host "        Verifie la zone autour de 'toLocaleDateString' / statsRowStyle" -ForegroundColor Yellow
    }
}

Write-FileUtf8NoBom -Path $upPath -Content $up

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Select-String -Path $wlPath -Pattern "useMyBadge|BadgeDisplay|FacetsList|BadgeProgressBar" |
    ForEach-Object { "  WL L$($_.LineNumber) : $($_.Line.Trim())" }
Write-Host ""
Select-String -Path $upPath -Pattern "useUserBadge|BadgeDisplay|FacetsList" |
    ForEach-Object { "  UP L$($_.LineNumber) : $($_.Line.Trim())" }

Write-Host ""
Write-Host "=== Insertions terminees ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Suite :" -ForegroundColor Yellow
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  git add -A" -ForegroundColor White
Write-Host "  git commit -m `"feat(badges): Phase A+B grade + facettes sneakerhead`"" -ForegroundColor White
Write-Host "  git push origin dev" -ForegroundColor White
Write-Host ""
