/**
 * MyOrders — historique des commandes de l'utilisateur.
 */
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { useMyOrders, statusLabel, statusColor, formatEur } from '../lib/stickerOrders'

export default function MyOrders() {
  const ordersQ = useMyOrders()

  if (ordersQ.isLoading) {
    return (
      <>
        <AppHeader leftActions={<BackButton />} />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Mes commandes</h1>
          <p style={mutedStyle}>Chargement…</p>
        </div>
      </>
    )
  }

  const orders = ordersQ.data ?? []

  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={pageStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>MES COMMANDES</h1>
          <p style={subtitleStyle}>{orders.length} commande{orders.length > 1 ? 's' : ''}</p>
        </header>

        {orders.length === 0 ? (
          <div style={emptyStyle}>
            <div style={emptyEmojiStyle}>📦</div>
            <h2 style={emptyTitleStyle}>Pas encore de commande</h2>
            <p style={mutedStyle}>
              Imprime tes premières étiquettes pour customiser tes boîtes.
            </p>
            <Link to="/labels" style={primaryCtaStyle}>→ Voir les étiquettes</Link>
          </div>
        ) : (
          <div style={listStyle}>
            {orders.map((order) => {
              const color = statusColor(order.status)
              return (
                <div key={order.id} style={orderCardStyle}>
                  <div style={orderHeaderStyle}>
                    <div>
                      <div style={orderIdStyle}>#{order.id.slice(0, 8).toUpperCase()}</div>
                      <div style={orderDateStyle}>
                        {new Date(order.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}
                      </div>
                    </div>
                    <div style={{ ...statusPillStyle, color: color.fg, background: color.bg }}>
                      {statusLabel(order.status)}
                    </div>
                  </div>

                  <div style={orderBodyStyle}>
                    <div style={orderRowStyle}>
                      <span style={orderLabelStyle}>{order.nb_stickers} sticker{order.nb_stickers > 1 ? 's' : ''}</span>
                      <span style={orderLabelStyle}>{order.nb_planches} planche{order.nb_planches > 1 ? 's' : ''}</span>
                      <span style={orderAmountStyle}>{formatEur(order.amount_total_cents / 100)}</span>
                    </div>

                    {order.tracking_number && (
                      <div style={trackingStyle}>
                        📦 {order.carrier ? `${order.carrier} · ` : ''}
                        {order.tracking_url ? (
                          <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" style={trackingLinkStyle}>
                            Suivre le colis : {order.tracking_number}
                          </a>
                        ) : (
                          <span style={{ fontWeight: 600 }}>{order.tracking_number}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

const pageStyle: CSSProperties = {
  maxWidth: 720, margin: '0 auto',
  padding: '24px 16px 80px',
  fontFamily: "'Outfit', sans-serif",
}
const headerStyle: CSSProperties = { marginBottom: 24 }
const titleStyle: CSSProperties = {
  fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em',
  color: 'var(--color-text)', margin: 0, lineHeight: 1.05,
}
const subtitleStyle: CSSProperties = {
  fontSize: 14, color: 'var(--color-text-muted)', marginTop: 8,
}
const mutedStyle: CSSProperties = { color: 'var(--color-text-muted)', fontSize: 13 }

const emptyStyle: CSSProperties = {
  textAlign: 'center', padding: 60, background: 'var(--color-surface)',
  borderRadius: 12, border: '1px solid var(--color-border)',
}
const emptyEmojiStyle: CSSProperties = { fontSize: 48, marginBottom: 16 }
const emptyTitleStyle: CSSProperties = {
  fontSize: 18, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 8px',
}
const primaryCtaStyle: CSSProperties = {
  display: 'inline-block', marginTop: 16,
  padding: '10px 20px', background: 'var(--color-bred)', color: '#FFFFFF',
  borderRadius: 999, textDecoration: 'none', fontWeight: 700, fontSize: 14,
}

const listStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 12,
}
const orderCardStyle: CSSProperties = {
  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: 12, padding: 16,
}
const orderHeaderStyle: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  marginBottom: 12,
}
const orderIdStyle: CSSProperties = {
  fontSize: 14, fontWeight: 800, color: 'var(--color-text)',
  fontVariantNumeric: 'tabular-nums',
}
const orderDateStyle: CSSProperties = {
  fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2,
}
const statusPillStyle: CSSProperties = {
  padding: '4px 10px', borderRadius: 999,
  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
}
const orderBodyStyle: CSSProperties = {
  borderTop: '1px solid #F3F4F6', paddingTop: 12,
}
const orderRowStyle: CSSProperties = {
  display: 'flex', gap: 16, alignItems: 'center', fontSize: 13,
}
const orderLabelStyle: CSSProperties = { color: 'var(--color-text-muted)' }
const orderAmountStyle: CSSProperties = {
  marginLeft: 'auto', fontWeight: 800, color: 'var(--color-text)',
  fontVariantNumeric: 'tabular-nums', fontSize: 15,
}
const trackingStyle: CSSProperties = {
  marginTop: 8, fontSize: 13, color: 'var(--color-text)',
  padding: 8, background: 'var(--color-surface-alt)', borderRadius: 6,
}
const trackingLinkStyle: CSSProperties = {
  color: 'var(--color-bred)', textDecoration: 'underline', fontWeight: 600,
}