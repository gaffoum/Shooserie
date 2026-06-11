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