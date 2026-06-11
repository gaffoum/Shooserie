# Lot 3 - file d'impression admin (commandes physiques)
# 1) cree src/components/AdminStickerOrders.tsx
# 2) ajoute 2 hooks + champ items dans src/lib/stickerOrders.ts
# 3) injecte <AdminStickerOrders/> dans src/pages/Admin.tsx
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
if(-not (Test-Path 'src/pages/Admin.tsx')){ Write-Host "ERREUR: lance depuis la racine du repo." -ForegroundColor Red; exit 1 }

# ---------------------------------------------------------------------------
# 1) Composant AdminStickerOrders.tsx
# ---------------------------------------------------------------------------
$component = @'
/**
 * AdminStickerOrders — file d'impression des commandes physiques payees.
 * Lecture/ecriture reservees a l'admin (policies RLS basees sur l'email).
 * La planche est generee depuis le snapshot `items` de la commande : aucun
 * acces aux sneakers du client, donc pas de souci RLS.
 */
import { useState, type CSSProperties } from 'react'
import {
  useAdminStickerOrders,
  useUpdateOrderStatus,
  statusLabel,
  statusColor,
  formatEur,
  type StickerOrder,
} from '@/lib/stickerOrders'
import { generateStickerPdf, downloadBlob } from '@/lib/stickerPdf'

const PDF_OPTIONS = {
  showPhoto: true,
  showSize: true,
  showQR: true,
  showBrandBar: true,
  qrBaseUrl: 'https://shooserie.tech/sneakers',
}

export function AdminStickerOrders() {
  const { data: orders, isLoading, error } = useAdminStickerOrders()

  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>🖨️ Commandes à imprimer</h2>
      {isLoading ? (
        <p style={mutedStyle}>Chargement…</p>
      ) : error ? (
        <p style={mutedStyle}>Erreur de chargement.</p>
      ) : !orders || orders.length === 0 ? (
        <p style={mutedStyle}>Aucune commande physique en attente. 🎉</p>
      ) : (
        <div style={listStyle}>
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </section>
  )
}

function OrderCard({ order }: { order: StickerOrder }) {
  const update = useUpdateOrderStatus()
  const [carrier, setCarrier] = useState(order.carrier ?? '')
  const [tracking, setTracking] = useState(order.tracking_number ?? '')
  const [isGen, setIsGen] = useState(false)
  const colors = statusColor(order.status)
  const items = order.items ?? []

  async function handlePrint() {
    if (items.length === 0) {
      alert('Cette commande n’a pas de snapshot de stickers.')
      return
    }
    setIsGen(true)
    try {
      const blob = await generateStickerPdf(items, PDF_OPTIONS)
      downloadBlob(blob, `planche-${order.id.slice(0, 8)}.pdf`)
    } catch (e) {
      console.error('PDF admin failed', e)
      alert('La génération du PDF a échoué.')
    } finally {
      setIsGen(false)
    }
  }

  return (
    <div style={cardStyle}>
      <div style={rowStyle}>
        <span style={idStyle}>#{order.id.slice(0, 8).toUpperCase()}</span>
        <span style={{ ...badgeStyle, background: colors.bg, color: colors.fg }}>
          {statusLabel(order.status)}
        </span>
      </div>

      <div style={metaStyle}>
        {order.nb_planches} planche{order.nb_planches > 1 ? 's' : ''} ·{' '}
        {order.nb_stickers} sticker{order.nb_stickers > 1 ? 's' : ''} ·{' '}
        {formatEur(order.amount_total_cents)}
        {order.paid_at ? ` · payée le ${formatDate(order.paid_at)}` : ''}
      </div>

      {order.shipping_name && (
        <div style={addrStyle}>
          <div style={{ fontWeight: 600 }}>{order.shipping_name}</div>
          <div>{order.shipping_address_line1}</div>
          {order.shipping_address_line2 && <div>{order.shipping_address_line2}</div>}
          <div>
            {order.shipping_postal_code} {order.shipping_city}
            {order.shipping_country ? ` (${order.shipping_country})` : ''}
          </div>
          {order.shipping_phone && <div>{order.shipping_phone}</div>}
        </div>
      )}

      <button type="button" onClick={handlePrint} disabled={isGen} style={printBtnStyle}>
        {isGen ? 'Génération…' : '📄 Générer la planche (PDF)'}
      </button>

      {order.status === 'paid' && (
        <button
          type="button"
          onClick={() => update.mutate({ id: order.id, status: 'preparing' })}
          disabled={update.isPending}
          style={stepBtnStyle}
        >
          Marquer « en préparation »
        </button>
      )}

      {(order.status === 'paid' || order.status === 'preparing') && (
        <div style={shipFormStyle}>
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Transporteur (ex: Colissimo)"
            style={inputStyle}
          />
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="N° de suivi"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() =>
              update.mutate({
                id: order.id,
                status: 'shipped',
                carrier: carrier.trim() || null,
                tracking_number: tracking.trim() || null,
              })
            }
            disabled={update.isPending}
            style={shipBtnStyle}
          >
            📦 Marquer « expédiée »
          </button>
        </div>
      )}

      {order.status === 'shipped' && (
        <div style={metaStyle}>
          Expédiée{order.carrier ? ` via ${order.carrier}` : ''}
          {order.tracking_number ? ` · ${order.tracking_number}` : ''}
        </div>
      )}
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

const sectionStyle: CSSProperties = { marginBottom: 24 }
const titleStyle: CSSProperties = { fontSize: 18, fontWeight: 700, margin: '0 0 12px' }
const mutedStyle: CSSProperties = { color: '#6B7280', fontSize: 14 }
const listStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 }
const cardStyle: CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #E5E7EB',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}
const rowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
const idStyle: CSSProperties = { fontWeight: 700, letterSpacing: 0.5 }
const badgeStyle: CSSProperties = { fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999 }
const metaStyle: CSSProperties = { fontSize: 13, color: '#6B7280' }
const addrStyle: CSSProperties = {
  fontSize: 13,
  color: '#0A0A0A',
  background: '#F9FAFB',
  borderRadius: 8,
  padding: '10px 12px',
  lineHeight: 1.4,
}
const printBtnStyle: CSSProperties = {
  background: '#0A0A0A',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 999,
  padding: '10px 16px',
  fontWeight: 600,
  cursor: 'pointer',
}
const stepBtnStyle: CSSProperties = {
  background: '#FFFFFF',
  color: '#0A0A0A',
  border: '1px solid #0A0A0A',
  borderRadius: 999,
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer',
}
const shipFormStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }
const inputStyle: CSSProperties = {
  border: '1px solid #D1D5DB',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 14,
}
const shipBtnStyle: CSSProperties = {
  background: '#CE1141',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 999,
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer',
}
'@
$compDir = 'src/components'
if(-not (Test-Path $compDir)){ New-Item -ItemType Directory -Path $compDir | Out-Null }
$comp = $component -replace "`r`n","`n"
Write-FileUtf8NoBom -Path "$compDir/AdminStickerOrders.tsx" -Content $comp
Get-ChildItem -Path "$compDir/AdminStickerOrders.tsx" -File | Unblock-File
Write-Host "  ok: AdminStickerOrders.tsx cree" -ForegroundColor DarkGray

# ---------------------------------------------------------------------------
# 2) stickerOrders.ts : import useQueryClient + champ items + 2 hooks
# ---------------------------------------------------------------------------
$soPath='src/lib/stickerOrders.ts'
$soRaw=Read-FileUtf8 $soPath
$soCRLF=$soRaw.Contains("`r`n")
$so=$soRaw -replace "`r`n","`n"

$so=Replace-Once $so "import { useMutation, useQuery } from '@tanstack/react-query'" "import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'" 'import useQueryClient'

$oldField=@'
  sneaker_ids: string[]
  nb_stickers: number
'@
$newField=@'
  sneaker_ids: string[]
  items: StickerSneaker[] | null
  nb_stickers: number
'@
$so=Replace-Once $so $oldField $newField 'champ items dans StickerOrder'

$hooks=@'

// ============================================================================
// ADMIN — file d'impression (commandes physiques)
// ============================================================================

/** [admin] Liste les commandes physiques actives (payees / en prepa / expediees). */
export function useAdminStickerOrders() {
  return useQuery({
    queryKey: ['admin-sticker-orders'],
    queryFn: async (): Promise<StickerOrder[]> => {
      const { data, error } = await supabase
        .from('sticker_orders')
        .select('*')
        .eq('type', 'physical')
        .in('status', ['paid', 'preparing', 'shipped'])
        .order('paid_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as StickerOrder[]
    },
    staleTime: 15 * 1000,
  })
}

export interface UpdateOrderStatusInput {
  id: string
  status: StickerOrder['status']
  carrier?: string | null
  tracking_number?: string | null
  tracking_url?: string | null
}

/** [admin] Met a jour le statut d'une commande (+ timestamps/suivi). */
export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateOrderStatusInput): Promise<void> => {
      const patch: Record<string, unknown> = { status: input.status }
      if (input.status === 'shipped') {
        patch.shipped_at = new Date().toISOString()
        if (input.carrier !== undefined) patch.carrier = input.carrier
        if (input.tracking_number !== undefined) patch.tracking_number = input.tracking_number
        if (input.tracking_url !== undefined) patch.tracking_url = input.tracking_url
      }
      if (input.status === 'delivered') {
        patch.delivered_at = new Date().toISOString()
      }
      const { error } = await supabase
        .from('sticker_orders')
        .update(patch)
        .eq('id', input.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-sticker-orders'] })
    },
  })
}
'@
$so = $so.TrimEnd() + "`n" + $hooks + "`n"
if($soCRLF){ $so=$so -replace "`n","`r`n" }
Write-FileUtf8NoBom -Path $soPath -Content $so
Get-ChildItem -Path $soPath -File | Unblock-File

# ---------------------------------------------------------------------------
# 3) Admin.tsx : import + injection
# ---------------------------------------------------------------------------
$adPath='src/pages/Admin.tsx'
$adRaw=Read-FileUtf8 $adPath
$adCRLF=$adRaw.Contains("`r`n")
$ad=$adRaw -replace "`r`n","`n"

$ad=Replace-Once $ad "import { formatEur } from '@/lib/format'" "import { formatEur } from '@/lib/format'`nimport { AdminStickerOrders } from '@/components/AdminStickerOrders'" 'import AdminStickerOrders'

$oldInject=@'
      <main style={mainStyle}>
        <header style={headerStyle}>
'@
$newInject=@'
      <main style={mainStyle}>
        <AdminStickerOrders />
        <header style={headerStyle}>
'@
$ad=Replace-Once $ad $oldInject $newInject 'injection AdminStickerOrders'

if($adCRLF){ $ad=$ad -replace "`n","`r`n" }
Write-FileUtf8NoBom -Path $adPath -Content $ad
Get-ChildItem -Path $adPath -File | Unblock-File

Write-Host "OK - Lot 3 front pose (composant + hooks + injection)." -ForegroundColor Green
