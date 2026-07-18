// Génère les icônes d'app depuis le logo du handoff (SVG → PNG/ICO).
// Fond plein #0A0A0A (pas de transparence → iOS ne pose pas de noir derrière ;
// coins carrés, iOS applique son propre arrondi). Lancé ponctuellement :
//   npm i -D sharp png-to-ico && node scripts/gen-icons.mjs && npm un sharp png-to-ico
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { writeFileSync, readFileSync } from 'node:fs'

const BG = '#0A0A0A'
const SRC = 'design/handoff/logo/shooserie-icon-dark.svg'
const svg = readFileSync(SRC)

async function png(size, out) {
  await sharp(svg, { density: 512 })
    .resize(size, size, { fit: 'contain' })
    .flatten({ background: BG }) // remplit les coins arrondis → carré plein, 0 transparence
    .png()
    .toFile(out)
  console.log('wrote', out)
}

await png(180, 'public/apple-touch-icon-v2.png') // iOS home screen
await png(192, 'public/icon-192-v2.png')          // manifest (Android/PWA)
await png(512, 'public/icon-512-v2.png')          // manifest
await png(32, 'public/favicon-32-tmp.png')        // source pour le .ico

const ico = await pngToIco(['public/favicon-32-tmp.png'])
writeFileSync('public/favicon.ico', ico)
console.log('wrote public/favicon.ico')
