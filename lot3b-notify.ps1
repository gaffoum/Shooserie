# Lot 3b - appelle notify-order-shipped apres passage en "expediee"
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

$old=@'
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sticker-orders'] })
    },
'@
$new=@'
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-sticker-orders'] })
      if (variables.status === 'shipped') {
        supabase.functions
          .invoke('notify-order-shipped', { body: { order_id: variables.id } })
          .catch((e) => console.error('notify shipped failed', e))
      }
    },
'@
$t=Replace-Once $t $old $new 'invoke notify-order-shipped'

if($hadCRLF){ $t=$t -replace "`n","`r`n" }
Write-FileUtf8NoBom -Path $path -Content $t
Get-ChildItem -Path $path -File | Unblock-File
Write-Host "OK - notification expedition branchee." -ForegroundColor Green
