# Fix create-sticker-order: URL Supabase en dur (VITE_SUPABASE_URL non definie sur Vercel) + parsing robuste
$ErrorActionPreference = 'Stop'
function Read-FileUtf8([string]$Path){ return [System.IO.File]::ReadAllText($Path,(New-Object System.Text.UTF8Encoding($false))) }
function Write-FileUtf8NoBom([string]$Path,[string]$Content){ [System.IO.File]::WriteAllText($Path,$Content,(New-Object System.Text.UTF8Encoding($false))) }
function Replace-Once([string]$text,[string]$old,[string]$new,[string]$label){
  $i=$text.IndexOf($old,[System.StringComparison]::Ordinal)
  if($i -lt 0){ throw "ANCRE INTROUVABLE: $label" }
  if($text.IndexOf($old,$i+1,[System.StringComparison]::Ordinal) -ge 0){ throw "ANCRE NON UNIQUE: $label" }
  Write-Host "  ok: $label" -ForegroundColor DarkGray
  return $text.Replace($old,$new)
}
$path='src/lib/stickerOrders.ts'
if(-not (Test-Path $path)){ Write-Host "ERREUR: lance depuis la racine du repo." -ForegroundColor Red; exit 1 }
$raw=Read-FileUtf8 $path
$hadCRLF=$raw.Contains("`r`n")
$t=$raw -replace "`r`n","`n"

# 1) URL en dur (comme stickerPdf.ts)
$oldUrl=@'
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-sticker-order`
'@
$newUrl=@'
      const url = 'https://eykhnpnmpcrvcpajirst.supabase.co/functions/v1/create-sticker-order'
'@
$t=Replace-Once $t $oldUrl $newUrl 'url en dur'

# 2) parsing robuste (ne plante plus sur corps vide / non-JSON)
$oldParse=@'
      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error ?? `HTTP ${response.status}`)
      }
      return body as CreateOrderResponse
'@
$newParse=@'
      const text = await response.text()
      let body: CreateOrderResponse | { error?: string }
      try {
        body = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(`Reponse invalide (HTTP ${response.status})`)
      }
      if (!response.ok) {
        throw new Error((body as { error?: string })?.error ?? `HTTP ${response.status}`)
      }
      return body as CreateOrderResponse
'@
$t=Replace-Once $t $oldParse $newParse 'parsing robuste'

if($hadCRLF){ $t=$t -replace "`n","`r`n" }
Write-FileUtf8NoBom -Path $path -Content $t
Get-ChildItem -Path $path -File | Unblock-File
Write-Host "OK - stickerOrders.ts corrige." -ForegroundColor Green
