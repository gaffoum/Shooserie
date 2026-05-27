# ============================================================
#  Shooserie - 3 cleanups finaux
#  1. Invalider 'my-collection-public' au toggle (Account.tsx)
#  2. Reformater l'indentation des routes marketplace/messages (App.tsx)
#  3. Ajouter manualChunks dans vite.config (split du bundle 623 kB)
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
Write-Host "=== Shooserie - 3 cleanups finaux ===" -ForegroundColor Cyan
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
# STEP 1 : Account.tsx - invalidation au toggle collection_public
# ============================================================
Write-Host "--- Step 1 : Account.tsx invalidation ---" -ForegroundColor Cyan
$accountPath = "src/pages/Account.tsx"
$accountContent = Read-FileUtf8 $accountPath
$changed = $false

# 1a. Import useQueryClient depuis @tanstack/react-query
if ($accountContent -match "\buseQueryClient\b") {
    Write-Host "  =  useQueryClient deja importe" -ForegroundColor DarkGray
} else {
    # Cherche un import existant de @tanstack/react-query
    $importPattern = "(import\s*\{)([^}]+?)(\}\s*from\s*['""]@tanstack/react-query['""])"
    if ($accountContent -match $importPattern) {
        $accountContent = [regex]::Replace(
            $accountContent,
            $importPattern,
            '${1}${2}, useQueryClient${3}',
            [System.Text.RegularExpressions.RegexOptions]::Singleline
        )
        Write-Host "  +  useQueryClient ajoute a l'import @tanstack/react-query existant" -ForegroundColor Green
    } else {
        # Aucun import @tanstack/react-query existant -> nouvelle ligne en tete
        $accountContent = "import { useQueryClient } from '@tanstack/react-query'`r`n" + $accountContent
        Write-Host "  +  Nouvel import useQueryClient ajoute en tete" -ForegroundColor Green
    }
    $changed = $true
}

# 1b. Declaration `const queryClient = useQueryClient()` juste avant `const isPublic = ...`
if ($accountContent -match "const\s+queryClient\s*=\s*useQueryClient\s*\(\s*\)") {
    Write-Host "  =  const queryClient deja declare" -ForegroundColor DarkGray
} else {
    $anchor = "const isPublic = profile?.collection_public ?? false"
    $replacement = "const queryClient = useQueryClient()`r`n  $anchor"
    if ($accountContent.Contains($anchor)) {
        $accountContent = $accountContent.Replace($anchor, $replacement)
        Write-Host "  +  const queryClient = useQueryClient() ajoute" -ForegroundColor Green
        $changed = $true
    } else {
        Write-Host "WARN  Ancre 'const isPublic = ...' introuvable" -ForegroundColor Yellow
    }
}

# 1c. Invalidation apres le mutateAsync
if ($accountContent -match "queryKey:\s*\[\s*['""]my-collection-public['""]\s*\]") {
    Write-Host "  =  Invalidation deja presente" -ForegroundColor DarkGray
} else {
    $anchor = "await updateMutation.mutateAsync({ collection_public: !isPublic })"
    $replacement = "$anchor`r`n      await queryClient.invalidateQueries({ queryKey: ['my-collection-public'] })"
    if ($accountContent.Contains($anchor)) {
        $accountContent = $accountContent.Replace($anchor, $replacement)
        Write-Host "  +  invalidateQueries('my-collection-public') ajoute apres mutateAsync" -ForegroundColor Green
        $changed = $true
    } else {
        Write-Host "WARN  Ancre mutateAsync introuvable, ajoute manuellement :" -ForegroundColor Yellow
        Write-Host "      await queryClient.invalidateQueries({ queryKey: ['my-collection-public'] })" -ForegroundColor Yellow
    }
}

if ($changed) {
    Write-FileUtf8NoBom -Path $accountPath -Content $accountContent
}

# ============================================================
# STEP 2 : App.tsx - reformater l'indentation marketplace/messages
# ============================================================
Write-Host ""
Write-Host "--- Step 2 : App.tsx indentation ---" -ForegroundColor Cyan
$appPath = "src/App.tsx"
$appContent = Read-FileUtf8 $appPath

# Bloc tel qu'il est actuellement (24-32 espaces d'indentation)
$badBlock = @'
                        <Route
                          path="/marketplace"
                          element={
                                <ProtectedRoute>
                                  <Marketplace />
                                </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/marketplace/:id"
                          element={
                                <ProtectedRoute>
                                  <MarketplaceDetail />
                                </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/messages"
                          element={
                                <ProtectedRoute>
                                  <Messaging />
                                </ProtectedRoute>
                          }
                        />
'@

# Bloc reformate (10 espaces, comme les autres routes)
$goodBlock = @'
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace/:id"
            element={
              <ProtectedRoute>
                <MarketplaceDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messaging />
              </ProtectedRoute>
            }
          />
'@

if ($appContent.Contains($badBlock)) {
    $appContent = $appContent.Replace($badBlock, $goodBlock)
    Write-FileUtf8NoBom -Path $appPath -Content $appContent
    Write-Host "  ~  Indentation marketplace/messages normalisee (24sp -> 10sp)" -ForegroundColor Green
} elseif ($appContent -match '<Route\s+path="/marketplace"' -and $appContent -match '<Route\s+path="/marketplace/:id"' -and $appContent -match '<Route\s+path="/messages"') {
    Write-Host "  =  Routes deja proprement indentees (ou structure differente)" -ForegroundColor DarkGray
} else {
    Write-Host "WARN  Routes marketplace/messages introuvables dans App.tsx" -ForegroundColor Yellow
}

# ============================================================
# STEP 3 : vite.config - ajouter manualChunks
# ============================================================
Write-Host ""
Write-Host "--- Step 3 : vite.config manualChunks ---" -ForegroundColor Cyan
$viteConfig = $null
foreach ($f in @("vite.config.ts", "vite.config.js", "vite.config.mts", "vite.config.mjs")) {
    if (Test-Path $f) { $viteConfig = $f; break }
}

if (-not $viteConfig) {
    Write-Host "WARN  vite.config.* introuvable a la racine" -ForegroundColor Yellow
} else {
    Write-Host "  Fichier detecte : $viteConfig"
    $viteContent = Read-FileUtf8 $viteConfig

    if ($viteContent -match "manualChunks") {
        Write-Host "  =  manualChunks deja present, skip" -ForegroundColor DarkGray
    } elseif ($viteContent -match "build\s*:\s*\{") {
        Write-Host "WARN  Un bloc 'build: {' existe deja dans $viteConfig" -ForegroundColor Yellow
        Write-Host "      Ajoute manuellement dans build.rollupOptions.output :" -ForegroundColor Yellow
        Write-Host "          manualChunks: {" -ForegroundColor Yellow
        Write-Host "            'react-vendor': ['react', 'react-dom', 'react-router-dom']," -ForegroundColor Yellow
        Write-Host "            'supabase': ['@supabase/supabase-js']," -ForegroundColor Yellow
        Write-Host "            'tanstack': ['@tanstack/react-query']," -ForegroundColor Yellow
        Write-Host "          }," -ForegroundColor Yellow
    } else {
        # Injection apres "defineConfig({"
        $marker = "defineConfig({"
        $idx = $viteContent.IndexOf($marker)
        if ($idx -lt 0) {
            Write-Host "WARN  'defineConfig({' introuvable dans $viteConfig" -ForegroundColor Yellow
        } else {
            $injection = @'

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'tanstack': ['@tanstack/react-query'],
        },
      },
    },
  },
'@
            $insertPos = $idx + $marker.Length
            $viteContent = $viteContent.Substring(0, $insertPos) + $injection + $viteContent.Substring($insertPos)
            Write-FileUtf8NoBom -Path $viteConfig -Content $viteContent
            Write-Host "  +  manualChunks injecte dans $viteConfig" -ForegroundColor Green
        }
    }
}

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Select-String -Path $accountPath -Pattern "useQueryClient|queryClient\.invalidateQueries|my-collection-public" |
    ForEach-Object { "  Account.tsx:$($_.LineNumber) : $($_.Line.Trim())" }
Select-String -Path $appPath -Pattern '<Route\s+path="/marketplace"|<Route\s+path="/messages"' |
    ForEach-Object { "  App.tsx:$($_.LineNumber) : $($_.Line.Trim())" }
if ($viteConfig) {
    Select-String -Path $viteConfig -Pattern "manualChunks|react-vendor|supabase|tanstack" |
        ForEach-Object { "  $($viteConfig):$($_.LineNumber) : $($_.Line.Trim())" }
}

# Verif anti-double-encodage sur les fichiers touches
foreach ($p in @($accountPath, $appPath)) {
    if (Test-Path $p) {
        $bytes = [System.IO.File]::ReadAllBytes((Join-Path (Get-Location).Path $p))
        $utf8 = [System.Text.Encoding]::UTF8.GetString($bytes)
        if ($utf8 -match "Ã©|Ã¨|Ã |Ã€") {
            Write-Host "  ERREUR : double-encodage dans $p" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== Cleanups appliques ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines etapes :" -ForegroundColor Yellow
Write-Host "  npm run build"
Write-Host "    -> Le bundle principal doit passer de ~623 kB a ~300-350 kB,"
Write-Host "       avec des chunks separes pour react-vendor, supabase, tanstack."
Write-Host ""
Write-Host "  git add -A"
Write-Host "  git commit -m `"chore: invalidate community link cache + cleanup App.tsx + vite chunks`""
Write-Host "  git push origin dev"
Write-Host ""
Write-Host "Test apres Vercel :" -ForegroundColor Yellow
Write-Host "  - Connecte en Titi (collection_public = false), va sur /account."
Write-Host "  - Toggle la visibilite en publique."
Write-Host "  - Le bouton 'Communaute' dans le header doit apparaitre DANS LA SECONDE,"
Write-Host "    sans attendre 60s ni F5."
Write-Host ""
