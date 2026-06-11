# Fix prix file admin : formatEur attend des euros (pas des centimes)
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
$path='src/components/AdminStickerOrders.tsx'
if(-not (Test-Path $path)){ Write-Host "ERREUR: lance depuis la racine du repo." -ForegroundColor Red; exit 1 }
$raw=Read-FileUtf8 $path
$hadCRLF=$raw.Contains("`r`n")
$t=$raw -replace "`r`n","`n"
$t=Replace-Once $t "{formatEur(order.amount_total_cents)}" "{formatEur(order.amount_total_cents / 100)}" 'prix en euros'
if($hadCRLF){ $t=$t -replace "`n","`r`n" }
Write-FileUtf8NoBom -Path $path -Content $t
Get-ChildItem -Path $path -File | Unblock-File
Write-Host "OK - prix corrige." -ForegroundColor Green
