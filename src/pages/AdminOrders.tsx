/**
 * AdminOrders — gestion des commandes (admin).
 * - Voir toutes les commandes (filtrable par statut)
 * - Marquer une commande comme "en preparation"
 * - Marquer une commande comme "expediee" avec tracking
 */
import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { useAllOrdersAdmin, useMarkOrderPreparing, useMarkOrderShipped } from '../lib/adminOrders'
import { statusLabel, statusColor, formatEur, type StickerOrder } from '../lib/stickerOrders'

const STATUSES_ORDER: StickerOrder['status'][] = [
  'paid', 'preparing', 'shipped', 'delivered', 'pending', 'cancelled', 'refunded',
]

type FilterKey = 'all' | 'todo' | StickerOrder['status']

export default function AdminOrders() {
  const ordersQ = useAllOrdersAdmin()
  const [filter, setFilter] = useState<FilterKey>('todo')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const orders = ordersQ.data ?? []

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {}
    for (const o of orders) map[o.status] = (map[o.status] ?? 0) + 1
    return map
  }, [orders])

  const filtered = useMemo(() => {
    if (filter === 'all') return orders
    if (filter === 'todo') {
      return orders.filter((o) => o.status === 'paid' || o.status === 'preparing')
    }
    return orders.filter((o) => o.status === filter)
  }, [orders, filter])

  if (ordersQ.isLoading) {
    return (
      <>
        <AppHeader leftActions={<BackButton />} />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Admin · Commandes</h1>
          <p style={mutedStyle}>Chargement…</p>
        </div>
      </>
    )
  }

  if (ordersQ.isError) {
    return (
      <>
        <AppHeader leftActions={<BackButton />} />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Erreur</h1>
          <p style={errorStyle}>{(ordersQ.error as Error)?.message}</p>
        </div>
      </>
    )
  }

  const totalAmount = orders
    .filter((o) => ['paid', 'preparing', 'shipped', 'delivered'].includes(o.status))
    .reduce((s, o) => s + o.amount_total_cents, 0) / 100

  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={pageStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>COMMANDES</h1>
          <p style={subtitleStyle}>
            {orders.length} commandes au total · CA confirmé : <strong>{formatEur(totalAmount)}</strong>
          </p>
        </header>

        {/* Filtres */}
        <div style={filtersStyle}>
          <FilterChip
            label={`À traiter (${(byStatus.paid ?? 0) + (byStatus.preparing ?? 0)})`}
            active={filter === 'todo'}
            onClick={() => setFilter('todo')}
            urgent={(byStatus.paid ?? 0) > 0}
          />
          {STATUSES_ORDER.map((s) => (
            <FilterChip
              key={s}
              label={`${statusLabel(s)} (${byStatus[s] ?? 0})`}
              active={filter === s}
              onClick={() => setFilter(s)}
            />
          ))}
          <FilterChip
            label={`Tous (${orders.length})`}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
        </div>

        {/* Liste */}
        <div style={listStyle}>
          {filtered.length === 0 ? (
            <p style={{ ...mutedStyle, textAlign: 'center', padding: 40 }}>
              Aucune commande pour ce filtre
            </p>
          ) : (
            filtered.map((order) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                expanded={expandedId === order.id}
                onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}

function FilterChip({
  label, active, onClick, urgent,
}: { label: string; active: boolean; onClick: () => void; urgent?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...filterChipStyle,
        ...(active ? filterChipActiveStyle : {}),
        ...(urgent && !active ? { borderColor: 'var(--color-bred)', color: 'var(--color-bred)' } : {}),
      }}
    >
      {label}
    </button>
  )
}

function AdminOrderCard({
  order, expanded, onToggle,
}: { order: StickerOrder; expanded: boolean; onToggle: () => void }) {
  const color = statusColor(order.status)
  const markPreparing = useMarkOrderPreparing()
  const markShipped = useMarkOrderShipped()

  const [carrier, setCarrier] = useState('La Poste')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')

  const canStartPrepare = order.status === 'paid'
  const canShip = order.status === 'paid' || order.status === 'preparing'

  return (
    <div style={cardStyle}>
      <div style={cardHeaderStyle} onClick={onToggle}>
        <div style={{ flex: 1 }}>
          <div style={cardIdStyle}>#{order.id.slice(0, 8).toUpperCase()}</div>
          <div style={cardCustomerStyle}>{order.shipping_name}</div>
          <div style={cardMetaStyle}>
            {new Date(order.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
            {' · '}
            {order.nb_stickers} stickers · {order.nb_planches} planche{order.nb_planches > 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={cardAmountStyle}>{formatEur(order.amount_total_cents / 100)}</div>
          <div style={{ ...statusPillStyle, color: color.fg, background: color.bg }}>
            {statusLabel(order.status)}
          </div>
        </div>
      </div>

      {expanded && (
        <div style={cardBodyStyle}>
          {/* Adresse */}
          <div style={blockStyle}>
            <div style={blockTitleStyle}>📦 Adresse</div>
            <div style={addrStyle}>
              <strong>{order.shipping_name}</strong><br />
              {order.shipping_address_line1}<br />
              {order.shipping_address_line2 && <>{order.shipping_address_line2}<br /></>}
              {order.shipping_postal_code} {order.shipping_city}<br />
              {order.shipping_country}
              {order.shipping_phone && <><br />📞 {order.shipping_phone}</>}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const text = `${order.shipping_name}\n${order.shipping_address_line1}\n${order.shipping_address_line2 ?? ''}\n${order.shipping_postal_code} ${order.shipping_city}\n${order.shipping_country}`
                navigator.clipboard.writeText(text)
                alert('Adresse copiée 📋')
              }}
              style={ghostBtnStyle}
            >
              📋 Copier l'adresse
            </button>
          </div>

          {/* Sneakers */}
          <div style={blockStyle}>
            <div style={blockTitleStyle}>👟 Sneakers ({order.sneaker_ids.length})</div>
            <div style={sneakerListStyle}>
              {order.sneaker_ids.map((id) => (
                <code key={id} style={sneakerIdStyle}>{id.slice(0, 8)}</code>
              ))}
            </div>
          </div>

          {/* Actions */}
          {canStartPrepare && (
            <div style={blockStyle}>
              <button
                type="button"
                onClick={() => markPreparing.mutate(order.id)}
                disabled={markPreparing.isPending}
                style={primaryBtnStyle}
              >
                {markPreparing.isPending ? '…' : '🎨 Marquer "En préparation"'}
              </button>
            </div>
          )}

          {canShip && (
            <div style={blockStyle}>
              <div style={blockTitleStyle}>🚚 Expédier</div>
              <div style={shipFormStyle}>
                <input
                  type="text"
                  placeholder="Transporteur (ex: La Poste)"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Numéro de suivi"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="URL de suivi (optionnel)"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!trackingNumber.trim()) {
                      alert('Numéro de suivi requis')
                      return
                    }
                    markShipped.mutate({
                      orderId: order.id,
                      carrier: carrier.trim(),
                      trackingNumber: trackingNumber.trim(),
                      trackingUrl: trackingUrl.trim() || undefined,
                    })
                  }}
                  disabled={markShipped.isPending || !trackingNumber.trim()}
                  style={primaryBtnStyle}
                >
                  {markShipped.isPending ? '…' : '✅ Marquer expédiée'}
                </button>
              </div>
            </div>
          )}

          {order.tracking_number && (
            <div style={blockStyle}>
              <div style={blockTitleStyle}>🔍 Tracking</div>
              <div style={{ fontSize: 13 }}>
                {order.carrier} · <strong>{order.tracking_number}</strong>
                {order.tracking_url && (
                  <> · <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" style={linkStyle}>Voir</a></>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ====== Styles ======
const pageStyle: CSSProperties = {
  maxWidth: 900, margin: '0 auto',
  padding: '24px 16px 80px',
  fontFamily: "'Outfit', sans-serif",
}
const headerStyle: CSSProperties = { marginBottom: 20 }
const titleStyle: CSSProperties = {
  fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em',
  color: 'var(--color-text)', margin: 0, lineHeight: 1.05,
}
const subtitleStyle: CSSProperties = {
  fontSize: 14, color: 'var(--color-text-muted)', marginTop: 8,
}
const mutedStyle: CSSProperties = { color: 'var(--color-text-muted)', fontSize: 13 }
const errorStyle: CSSProperties = { color: 'var(--color-bred)', fontSize: 13 }

const filtersStyle: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20,
}
const filterChipStyle: CSSProperties = {
  padding: '6px 14px', fontSize: 12, fontWeight: 600,
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 999, color: 'var(--color-text-muted)', cursor: 'pointer',
  fontFamily: 'inherit',
}
const filterChipActiveStyle: CSSProperties = {
  background: '#0A0A0A', color: '#FFFFFF', borderColor: '#0A0A0A',
}

const listStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12,
}
const cardStyle: CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 12, overflow: 'hidden',
}
const cardHeaderStyle: CSSProperties = {
  display: 'flex', gap: 12, padding: 16, cursor: 'pointer',
}
const cardIdStyle: CSSProperties = {
  fontSize: 13, fontWeight: 800, color: 'var(--color-text)',
  fontVariantNumeric: 'tabular-nums',
}
const cardCustomerStyle: CSSProperties = {
  fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginTop: 2,
}
const cardMetaStyle: CSSProperties = {
  fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2,
}
const cardAmountStyle: CSSProperties = {
  fontSize: 16, fontWeight: 800, color: 'var(--color-text)',
  fontVariantNumeric: 'tabular-nums', marginBottom: 4,
}
const statusPillStyle: CSSProperties = {
  display: 'inline-block', padding: '3px 9px', borderRadius: 999,
  fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
}

const cardBodyStyle: CSSProperties = {
  borderTop: '1px solid #F3F4F6', padding: 16,
}
const blockStyle: CSSProperties = { marginBottom: 16 }
const blockTitleStyle: CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
}
const addrStyle: CSSProperties = {
  fontSize: 13, lineHeight: 1.6, color: 'var(--color-text)',
  background: 'var(--color-surface-alt)', padding: 12, borderRadius: 8,
  marginBottom: 8,
}
const sneakerListStyle: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 6,
}
const sneakerIdStyle: CSSProperties = {
  fontSize: 11, padding: '3px 8px', background: 'var(--color-surface-alt)',
  borderRadius: 4, fontFamily: 'monospace', color: 'var(--color-text-muted)',
}

const ghostBtnStyle: CSSProperties = {
  padding: '6px 12px', fontSize: 12, fontWeight: 600,
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 8, color: 'var(--color-text)', cursor: 'pointer',
  fontFamily: 'inherit',
}
const primaryBtnStyle: CSSProperties = {
  padding: '10px 20px', fontSize: 13, fontWeight: 700,
  background: 'var(--color-bred)', color: '#FFFFFF', border: 'none',
  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
}
const shipFormStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
}
const inputStyle: CSSProperties = {
  padding: '10px 12px', fontSize: 13, borderRadius: 8,
  border: '1px solid var(--color-border)', fontFamily: 'inherit',
}
const linkStyle: CSSProperties = {
  color: 'var(--color-bred)', textDecoration: 'underline',
}