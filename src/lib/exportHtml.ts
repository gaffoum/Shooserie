/**
 * Collection export → standalone HTML file.
 *
 * Pure client-side: takes the user's filtered+sorted list of sneakers and
 * builds a complete self-contained HTML document (CSS + JS inline, no
 * external assets except StockX CDN images which are public). The file is
 * triggered as a download and can be shared via email, messaging app, etc.
 *
 * Privacy: only public-facing fields are included (no purchase price by
 * default, no notes, no purchase date). The recipient sees what the user
 * would publish on Instagram, not their private accounting.
 *
 * Photos: we reference StockX CDN URLs directly. User-uploaded photos
 * (Supabase Storage signed URLs) are intentionally NOT embedded because
 * those URLs expire — the recipient might open the file days later. Falling
 * back to the placeholder is more honest than serving a broken image.
 */
import type { Sneaker } from './types'
import { calcDelta, effectiveCost, formatEur, formatPct } from './format'

export interface ExportOptions {
  /** Title shown at the top. Defaults to "Ma collection". */
  title?: string
  /** Show the market value totals at the top. Default true. */
  showTotals?: boolean
  /** Show the +/- delta column / pill. Default true. */
  showDelta?: boolean
  /** Show the for-sale badge. Default true. */
  showForSale?: boolean
  /** Locale used for date formatting and a few hardcoded labels (FR or EN). */
  locale?: 'fr' | 'en'
}

/**
 * Build a complete HTML document as a string. Caller is responsible for
 * triggering the download.
 */
export function generateCollectionHtml(
  sneakers: Sneaker[],
  options: ExportOptions = {},
): string {
  const {
    title = 'Ma collection',
    showTotals = true,
    showDelta = true,
    showForSale = true,
    locale = 'fr',
  } = options

  const tr = locale === 'fr' ? FR : EN

  // Totals
  const totalMarket = sneakers.reduce(
    (s, x) => s + (x.market_price ?? 0),
    0,
  )
  const pairsCount = sneakers.length

  // Date stamp for the footer / title
  const now = new Date()
  const dateLabel = now.toLocaleDateString(
    locale === 'fr' ? 'fr-FR' : 'en-US',
    { day: '2-digit', month: 'long', year: 'numeric' },
  )

  // Build the cards (grid view markup) and rows (list view markup).
  // Both are rendered side-by-side; CSS shows one or the other based on a
  // data attribute on <main>. The JS toggle just flips that attribute.
  const cards = sneakers
    .map((s) => renderCard(s, { showForSale, showDelta, tr }))
    .join('\n')
  const rows = sneakers
    .map((s) => renderRow(s, { showForSale, showDelta, tr }))
    .join('\n')

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} — Shooserie</title>
<meta name="generator" content="Shooserie (shooserie.tech)" />
<style>
${css()}
</style>
</head>
<body>
<header class="hdr">
  <div class="hdr-left">
    <h1 class="title">${escapeHtml(title)}</h1>
    <div class="subtitle">${escapeHtml(tr.exportedOn)} ${escapeHtml(dateLabel)}</div>
  </div>
  ${
    showTotals
      ? `<div class="totals">
    <div class="kpi">
      <div class="kpi-label">${escapeHtml(tr.pairs)}</div>
      <div class="kpi-value">${pairsCount}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">${escapeHtml(tr.currentValue)}</div>
      <div class="kpi-value">${escapeHtml(formatEur(totalMarket))}</div>
    </div>
  </div>`
      : ''
  }
</header>

<nav class="view-toggle" role="tablist" aria-label="${escapeHtml(tr.viewToggle)}">
  <button type="button" data-view="grid" class="active" role="tab" aria-selected="true">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
    ${escapeHtml(tr.grid)}
  </button>
  <button type="button" data-view="list" role="tab" aria-selected="false">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>
    ${escapeHtml(tr.list)}
  </button>
</nav>

<main data-view="grid">
  ${
    pairsCount === 0
      ? `<div class="empty">${escapeHtml(tr.empty)}</div>`
      : `
  <section class="grid">
    ${cards}
  </section>
  <section class="list">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>${escapeHtml(tr.model)}</th>
          <th>${escapeHtml(tr.size)}</th>
          <th class="num">${escapeHtml(tr.value)}</th>
          ${showDelta ? `<th class="num">+/-</th>` : ''}
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </section>
  `
  }
</main>

<footer class="ftr">
  <span>${escapeHtml(tr.generatedBy)}</span>
  <a href="https://shooserie.tech" target="_blank" rel="noopener">shooserie.tech</a>
</footer>

<script>
${js()}
</script>
</body>
</html>`
}

/* =========================================================================
 * Per-row renderers
 * ========================================================================= */

interface RenderCtx {
  showForSale: boolean
  showDelta: boolean
  tr: typeof FR
}

function renderCard(s: Sneaker, ctx: RenderCtx): string {
  const delta = calcDelta(effectiveCost(s), s.market_price)
  const sizeLabel = formatSizeLabel(s.size_eu, s.size_us, ctx.tr)
  const price = s.market_price ?? effectiveCost(s)
  return `
    <article class="card">
      <div class="thumb">
        ${
          s.stockx_image_url
            ? `<img src="${escapeAttr(s.stockx_image_url)}" alt="${escapeAttr(s.name)}" loading="lazy" />`
            : `<div class="thumb-empty" aria-hidden="true"></div>`
        }
        ${ctx.showForSale && s.is_for_sale ? `<span class="ribbon">${escapeHtml(ctx.tr.forSale)}</span>` : ''}
      </div>
      <div class="meta">
        ${s.brand ? `<div class="brand">${escapeHtml(s.brand)}</div>` : ''}
        <div class="name">${escapeHtml(s.name)}</div>
        ${sizeLabel ? `<div class="size">${escapeHtml(sizeLabel)}</div>` : ''}
        <div class="bottom">
          <div class="price">${escapeHtml(formatEur(price))}</div>
          ${
            ctx.showDelta && delta.pct !== null
              ? `<div class="delta ${delta.pct >= 0 ? 'up' : 'down'}">${escapeHtml(formatPct(delta.pct, true))}</div>`
              : ''
          }
        </div>
      </div>
    </article>`
}

function renderRow(s: Sneaker, ctx: RenderCtx): string {
  const delta = calcDelta(effectiveCost(s), s.market_price)
  const sizeLabel = formatSizeLabel(s.size_eu, s.size_us, ctx.tr)
  const price = s.market_price ?? effectiveCost(s)
  return `
    <tr>
      <td class="row-thumb">
        ${
          s.stockx_image_url
            ? `<img src="${escapeAttr(s.stockx_image_url)}" alt="${escapeAttr(s.name)}" loading="lazy" />`
            : `<div class="row-thumb-empty" aria-hidden="true"></div>`
        }
      </td>
      <td>
        <div class="row-brand">${s.brand ? escapeHtml(s.brand) : ''}</div>
        <div class="row-name">${escapeHtml(s.name)}${ctx.showForSale && s.is_for_sale ? ` <span class="tag-sale">${escapeHtml(ctx.tr.forSale)}</span>` : ''}</div>
      </td>
      <td class="row-size">${escapeHtml(sizeLabel || '—')}</td>
      <td class="num">${escapeHtml(formatEur(price))}</td>
      ${
        ctx.showDelta
          ? `<td class="num">${
              delta.pct !== null
                ? `<span class="delta ${delta.pct >= 0 ? 'up' : 'down'}">${escapeHtml(formatPct(delta.pct, true))}</span>`
                : '—'
            }</td>`
          : ''
      }
    </tr>`
}

/* =========================================================================
 * Helpers
 * ========================================================================= */

function formatSizeLabel(
  eu: string | null,
  us: string | null,
  tr: typeof FR,
): string {
  const parts: string[] = []
  if (eu) parts.push(`EU ${eu}`)
  if (us) parts.push(`US ${us}`)
  return parts.length ? parts.join(' · ') : tr.noSize
}

/** HTML-escape a string for safe insertion in HTML content. */
function escapeHtml(input: string | number): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Same as escapeHtml but for HTML attribute values. */
function escapeAttr(input: string): string {
  return escapeHtml(input)
}

/* =========================================================================
 * Localised labels (FR + EN). Kept inline because the export must be
 * self-contained — no runtime dependency on the app's i18n context.
 * ========================================================================= */

const FR = {
  exportedOn: 'Exporté le',
  pairs: 'Paires',
  currentValue: 'Cote actuelle',
  viewToggle: 'Changer la vue',
  grid: 'Grille',
  list: 'Liste',
  model: 'Modèle',
  size: 'Taille',
  value: 'Cote',
  empty: 'Aucune paire à afficher.',
  forSale: 'À vendre',
  noSize: 'Sans taille',
  generatedBy: 'Généré par Shooserie ·',
}

const EN: typeof FR = {
  exportedOn: 'Exported on',
  pairs: 'Pairs',
  currentValue: 'Market value',
  viewToggle: 'Toggle view',
  grid: 'Grid',
  list: 'List',
  model: 'Model',
  size: 'Size',
  value: 'Value',
  empty: 'No pairs to display.',
  forSale: 'For sale',
  noSize: 'No size',
  generatedBy: 'Generated by Shooserie ·',
}

/* =========================================================================
 * CSS for the exported document.
 * Self-contained, no external fonts (uses system stack), no JS-dependent
 * styles, and renders correctly even when offline.
 * ========================================================================= */

function css(): string {
  return `
:root {
  --bg: #F5F5F5;
  --surface: #FFFFFF;
  --text: #0A0A0A;
  --muted: #6B6B6B;
  --faint: #9CA3AF;
  --border: #E5E5E5;
  --bred: #CE1141;
  --up: #16A34A;
  --up-bg: rgba(22, 163, 74, 0.12);
  --down: #DC2626;
  --down-bg: rgba(220, 38, 38, 0.12);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

.hdr {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 20px 20px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.subtitle {
  margin-top: 4px;
  font-size: 12px;
  color: var(--muted);
}
.totals {
  display: flex;
  gap: 10px;
}
.kpi {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 110px;
}
.kpi-label {
  font-size: 10px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 500;
  margin-bottom: 4px;
}
.kpi-value {
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.view-toggle {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 14px;
  display: flex;
  gap: 6px;
}
.view-toggle button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: var(--surface);
  color: var(--muted);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;
}
.view-toggle button.active {
  background: var(--text);
  color: var(--surface);
  border-color: var(--text);
}
.view-toggle button:not(.active):hover {
  border-color: var(--text);
  color: var(--text);
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
}
main[data-view="grid"] .list { display: none; }
main[data-view="list"] .grid { display: none; }

.empty {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  color: var(--muted);
}

/* ----- Grid view ----- */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.thumb {
  position: relative;
  aspect-ratio: 1 / 1;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  overflow: hidden;
}
.thumb img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
}
.thumb-empty { width: 100%; height: 100%; }
.ribbon {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--bred);
  color: #FFFFFF;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}
.meta { padding: 12px 14px 14px; }
.brand {
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
  font-weight: 500;
  margin-bottom: 4px;
}
.name {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 36px;
}
.size {
  margin-top: 6px;
  font-size: 11px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.bottom {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.price {
  font-size: 15px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.delta {
  display: inline-block;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.delta.up { color: var(--up); background: var(--up-bg); }
.delta.down { color: var(--down); background: var(--down-bg); }

/* ----- List view ----- */
.list {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.list table {
  width: 100%;
  border-collapse: collapse;
}
.list thead th {
  text-align: left;
  padding: 12px 16px;
  background: var(--bg);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-weight: 500;
  border-bottom: 1px solid var(--border);
}
.list thead th.num { text-align: right; }
.list tbody td {
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
.list tbody tr:last-child td { border-bottom: none; }
.list td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
.row-thumb { width: 56px; padding-right: 0 !important; }
.row-thumb img,
.row-thumb-empty {
  display: block;
  width: 48px;
  height: 48px;
  object-fit: contain;
  background: var(--bg);
  border-radius: 6px;
  padding: 4px;
}
.row-brand {
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--faint);
  font-weight: 500;
}
.row-name { font-size: 13px; font-weight: 500; margin-top: 2px; }
.row-size { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
.tag-sale {
  display: inline-block;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: var(--bred);
  color: #FFFFFF;
  padding: 2px 6px;
  border-radius: 3px;
  vertical-align: middle;
  margin-left: 6px;
}

.ftr {
  max-width: 1200px;
  margin: 24px auto 0;
  padding: 20px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--muted);
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}
.ftr a {
  color: var(--bred);
  font-weight: 600;
  text-decoration: none;
}
.ftr a:hover { text-decoration: underline; }

@media (max-width: 640px) {
  .hdr { padding: 20px 16px 14px; }
  .totals { width: 100%; }
  .kpi { flex: 1; min-width: 0; }
  .view-toggle { padding: 0 16px 12px; }
  main { padding: 0 16px 32px; }
  .title { font-size: 22px; }
  .list thead { display: none; }
  .list tbody td { padding: 8px 12px; }
  .row-thumb { padding-left: 12px !important; }
}
`
}

/* =========================================================================
 * JS for the exported document — just the grid/list toggle.
 * ========================================================================= */

function js(): string {
  return `
(function() {
  var buttons = document.querySelectorAll('.view-toggle button');
  var main = document.querySelector('main');
  if (!buttons.length || !main) return;
  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var view = btn.getAttribute('data-view');
      main.setAttribute('data-view', view);
      buttons.forEach(function(b) {
        var active = b === btn;
        b.classList.toggle('active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    });
  });
})();
`
}

/* =========================================================================
 * Public helper to trigger a browser download of the generated HTML.
 * ========================================================================= */

export function downloadCollectionHtml(
  sneakers: Sneaker[],
  options: ExportOptions = {},
): void {
  const html = generateCollectionHtml(sneakers, options)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const datePart = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  a.download = `shooserie-collection-${datePart}.html`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke so Firefox can finish the download. 1s is comfortable.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
