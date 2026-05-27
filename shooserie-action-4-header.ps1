# ============================================================
#  Shooserie - Action #4 - Lien "Communaute" dans AppHeader
#  Affiche le lien uniquement si la collection de l'utilisateur
#  connecte est publique (collection_public = true).
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path (Get-Location).Path $Path }
    [System.IO.File]::WriteAllText($full, $Content, (New-Object System.Text.UTF8Encoding $false))
}

function Read-FileUtf8 {
    param([string]$Path)
    $full = if ([System.IO.Path]::IsPathRooted($Path)) { $Path } else { Join-Path (Get-Location).Path $Path }
    return [System.IO.File]::ReadAllText($full, [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "=== Shooserie - Lien Communaute dans AppHeader ===" -ForegroundColor Cyan
$currentBranch = ""
try { $currentBranch = (git branch --show-current 2>$null).Trim() } catch {}
Write-Host "Branche actuelle : $currentBranch"
if ($currentBranch -ne "dev") {
    Write-Host "WARN  Tu n'es pas sur 'dev' (actuelle: '$currentBranch')" -ForegroundColor Red
    $confirm = Read-Host "Continuer quand meme ? (o/N)"
    if ($confirm -ne "o" -and $confirm -ne "O") { exit 0 }
}
Write-Host ""

# ============================================================
# 1. Hook useMyCollectionPublic dans publicProfileQueries.ts
# ============================================================
$queriesPath = "src/lib/publicProfileQueries.ts"
$queriesContent = Read-FileUtf8 $queriesPath

if ($queriesContent -match "useMyCollectionPublic") {
    Write-Host "  =  useMyCollectionPublic deja present, skip" -ForegroundColor DarkGray
} else {
    # Ajout de l'import useAuth si pas deja la
    if ($queriesContent -notmatch "from\s+['""]\.\.\/contexts\/AuthContext['""]") {
        $authImport = "import { useAuth } from '../contexts/AuthContext'`r`n"
        # Insere apres la derniere ligne d'import
        $lines = $queriesContent -split "`r?`n"
        $lastImportIdx = -1
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^\s*import\s") { $lastImportIdx = $i }
        }
        if ($lastImportIdx -ge 0) {
            $before = $lines[0..$lastImportIdx]
            $after = if ($lastImportIdx + 1 -lt $lines.Count) { $lines[($lastImportIdx + 1)..($lines.Count - 1)] } else { @() }
            $queriesContent = (@($before) + "import { useAuth } from '../contexts/AuthContext'" + @($after)) -join "`r`n"
        }
    }

    $newHook = @'


/**
 * Retourne true si la collection de l'utilisateur connecte est publique.
 * Utilise pour conditionner l'affichage du lien /community dans la nav.
 *
 * Cache-key indexee sur user.id => invalide a la connexion/deconnexion.
 * Apres un toggle de visibilite, penser a :
 *   queryClient.invalidateQueries({ queryKey: ['my-collection-public'] })
 */
export function useMyCollectionPublic() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['my-collection-public', user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('collection_public')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      return data?.collection_public === true
    },
    staleTime: 60_000,
  })
}
'@

    $queriesContent = $queriesContent.TrimEnd() + $newHook + "`n"
    Write-FileUtf8NoBom -Path $queriesPath -Content $queriesContent
    Write-Host "  +  useMyCollectionPublic dans $queriesPath" -ForegroundColor Green
}

# ============================================================
# 2. Patch src/components/AppHeader.tsx
# ============================================================
$headerPath = "src/components/AppHeader.tsx"
$headerContent = Read-FileUtf8 $headerPath

# --- 2a. Import du hook ---
if ($headerContent -match "useMyCollectionPublic") {
    Write-Host "  =  Import useMyCollectionPublic deja present, skip" -ForegroundColor DarkGray
} else {
    # Ancre stable : import existant du fichier queries
    $importAnchor = "import { ADMIN_EMAIL, useUserCount , useMyProfile} from '@/lib/queries'"
    $newImport = "import { useMyCollectionPublic } from '@/lib/publicProfileQueries'"
    if ($headerContent.Contains($importAnchor)) {
        $headerContent = $headerContent.Replace(
            $importAnchor,
            $importAnchor + "`r`n" + $newImport
        )
        Write-Host "  +  Import useMyCollectionPublic ajoute" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre import queries non trouvee exactement, fallback :" -ForegroundColor Yellow
        # Fallback : insere apres le dernier import
        $lines = $headerContent -split "`r?`n"
        $lastImportIdx = -1
        for ($i = 0; $i -lt $lines.Count; $i++) {
            if ($lines[$i] -match "^import\s") { $lastImportIdx = $i }
        }
        if ($lastImportIdx -ge 0) {
            $before = $lines[0..$lastImportIdx]
            $after = if ($lastImportIdx + 1 -lt $lines.Count) { $lines[($lastImportIdx + 1)..($lines.Count - 1)] } else { @() }
            $headerContent = (@($before) + $newImport + @($after)) -join "`r`n"
            Write-Host "  +  Import ajoute (fallback)" -ForegroundColor Green
        }
    }
}

# --- 2b. Hook usage dans le component ---
if ($headerContent -match "isCollectionPublic") {
    Write-Host "  =  Usage useMyCollectionPublic deja present, skip" -ForegroundColor DarkGray
} else {
    $hookAnchor = "const isAdmin = user?.email === ADMIN_EMAIL"
    $newHookUsage = "$hookAnchor`r`n  const { data: isCollectionPublic } = useMyCollectionPublic()"
    if ($headerContent.Contains($hookAnchor)) {
        $headerContent = $headerContent.Replace($hookAnchor, $newHookUsage)
        Write-Host "  +  Hook usage ajoute dans le component" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre 'const isAdmin' non trouvee" -ForegroundColor Yellow
    }
}

# --- 2c. JSX du Link conditionnel ---
if ($headerContent -match '"/community"') {
    Write-Host "  =  Link /community deja present, skip" -ForegroundColor DarkGray
} else {
    # On ancre sur la fin du bloc isAdmin (qui se termine par ")}" suivi d'un blanc)
    # Pour rester robuste face aux variantes d'indentation, on cherche un pattern unique
    # juste apres : le commentaire d'email. Mais ce commentaire contient des accents,
    # donc on prefere ancrer sur la balise Link de l'email.
    $jsxAnchor = '<Link
          to="/account"
          className="app-header-email"'
    $newLinkBlock = @'
{isCollectionPublic && (
          <Link
            to="/community"
            className="app-header-community"
            style={communityLinkStyle}
            title="Voir les collections publiques"
          >
            Communauté
          </Link>
        )}
        <Link
          to="/account"
          className="app-header-email"
'@
    if ($headerContent.Contains($jsxAnchor)) {
        $headerContent = $headerContent.Replace($jsxAnchor, $newLinkBlock)
        Write-Host "  +  Link /community conditionnel ajoute dans le JSX" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre JSX (Link app-header-email) non trouvee exactement" -ForegroundColor Yellow
        Write-Host "      Ajoute manuellement avant <Link to=`"/account`" className=`"app-header-email`"...>" -ForegroundColor Yellow
        Write-Host "      le bloc :" -ForegroundColor Yellow
        Write-Host "      {isCollectionPublic && (<Link to=`"/community`" ...>Communaute</Link>)}" -ForegroundColor Yellow
    }
}

# --- 2d. Style communityLinkStyle ---
if ($headerContent -match "communityLinkStyle") {
    Write-Host "  =  communityLinkStyle deja present, skip" -ForegroundColor DarkGray
} else {
    # Ajoute en fin de fichier, apres les autres styles. Pas d'ancre precise
    # necessaire : on append a la fin et le bundler s'en moque.
    $newStyle = @'


const communityLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  color: 'var(--color-text)',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}
'@
    $headerContent = $headerContent.TrimEnd() + $newStyle + "`r`n"
    Write-Host "  +  communityLinkStyle ajoute en fin de fichier" -ForegroundColor Green
}

Write-FileUtf8NoBom -Path $headerPath -Content $headerContent

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Select-String -Path $queriesPath -Pattern "useMyCollectionPublic" |
    ForEach-Object { "  $($_.Filename):$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path $headerPath -Pattern "useMyCollectionPublic|isCollectionPublic|/community|communityLinkStyle" |
    ForEach-Object { "  $($_.Filename):$($_.LineNumber) : $($_.Line.Trim())" }

Write-Host ""
Write-Host "=== Patch applique ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes :" -ForegroundColor Yellow
Write-Host "  npm run build"
Write-Host "  git add src/lib/publicProfileQueries.ts src/components/AppHeader.tsx"
Write-Host "  git commit -m `"feat(community): conditional /community link in AppHeader`""
Write-Host "  git push origin dev"
Write-Host ""
Write-Host "Test apres Vercel :" -ForegroundColor Yellow
Write-Host "  - Connecte en Layon (collection_public = true)  -> lien Communaute visible"
Write-Host "  - Connecte en Titi  (collection_public = false) -> lien INVISIBLE"
Write-Host "  - Clic sur Communaute -> ouvre /community"
Write-Host ""
Write-Host "Note : apres un toggle de visibilite cote utilisateur, il faut" -ForegroundColor DarkGray
Write-Host "       invalider la cache : queryClient.invalidateQueries({ queryKey: ['my-collection-public'] })" -ForegroundColor DarkGray
Write-Host "       Sinon le lien apparait/disparait au bout de 60s (staleTime)." -ForegroundColor DarkGray
Write-Host ""
