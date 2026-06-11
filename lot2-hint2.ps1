# Lot 2 - passe le texte d'aide /labels sur 2 lignes (une option par ligne)
$ErrorActionPreference = 'Stop'
function Read-FileUtf8([string]$Path){ return [System.IO.File]::ReadAllText($Path,(New-Object System.Text.UTF8Encoding($false))) }
function Write-FileUtf8NoBom([string]$Path,[string]$Content){ [System.IO.File]::WriteAllText($Path,$Content,(New-Object System.Text.UTF8Encoding($false))) }
function Try-ReplaceOnce([string]$text,[string[]]$olds,[string]$new,[string]$label){
  foreach($old in $olds){
    $i=$text.IndexOf($old,[System.StringComparison]::Ordinal)
    if($i -ge 0){
      if($text.IndexOf($old,$i+1,[System.StringComparison]::Ordinal) -ge 0){ throw "ANCRE NON UNIQUE: $label" }
      Write-Host "  ok: $label" -ForegroundColor DarkGray
      return $text.Replace($old,$new)
    }
  }
  throw "ANCRE INTROUVABLE: $label"
}
$path='src/pages/Labels.tsx'
if(-not (Test-Path $path)){ Write-Host "ERREUR: lance depuis la racine du repo." -ForegroundColor Red; exit 1 }
$raw=Read-FileUtf8 $path
$hadCRLF=$raw.Contains("`r`n")
$t=$raw -replace "`r`n","`n"

$oldA=@'
              : 'PDF : tu imprimes toi-même (dès 5 planches : 1,50 €/planche). Planche imprimée : expédiée chez toi (dès 5 : 5 €, dès 10 : 4 €).'}
'@
$oldB=@'
              : 'PDF à imprimer toi-même : 2 €/planche de 8 stickers (1,50 € dès 5 planches). Planche imprimée et expédiée : 6 €/planche (5 € dès 5, 4 € dès 10).'}
'@
$new=@'
              : (
                <>
                  PDF à imprimer toi-même : 2 €/planche de 8 stickers (1,50 € dès 5 planches).
                  <br />
                  Planche imprimée et expédiée : 6 €/planche (5 € dès 5, 4 € dès 10).
                </>
              )}
'@
$t=Try-ReplaceOnce $t @($oldA,$oldB) $new 'hint 2 lignes'

if($hadCRLF){ $t=$t -replace "`n","`r`n" }
Write-FileUtf8NoBom -Path $path -Content $t
Get-ChildItem -Path $path -File | Unblock-File
Write-Host "OK - hint sur 2 lignes." -ForegroundColor Green
