/**
 * CheckoutLabels — page de commande des planches imprimees.
 * Workflow :
 *   1. L'utilisateur arrive avec une liste de sneaker_ids dans le location.state
 *   2. Saisit son adresse de livraison
 *   3. Voit le recap prix degressif
 *   4. Clique sur "Payer" -> redirige vers Stripe Checkout
 *   5. Stripe redirige vers /orders/:id/success
 */
import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { useCreateOrder } from '../lib/stickerOrders'
import { calculatePricing, formatEur } from '../lib/stickerPricing'

interface LocationState {
  sneakerIds?: string[]
}

export default function CheckoutLabels() {
  const location = useLocation()
  const navigate = useNavigate()
  const sneakerIds = (location.state as LocationState | null)?.sneakerIds ?? []

  // Redirige vers /labels si pas de selection
  useEffect(() => {
    if (sneakerIds.length === 0) {
      navigate('/labels', { replace: true })
    }
  }, [sneakerIds.length, navigate])

  const pricing = useMemo(() => calculatePricing(sneakerIds.length), [sneakerIds.length])

  const [name, setName] = useState('')
  const [addr1, setAddr1] = useState('')
  const [addr2, setAddr2] = useState('')
  const [postal, setPostal] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [acceptCgv, setAcceptCgv] = useState(false)
  const [acceptCustom, setAcceptCustom] = useState(false)

  const createOrder = useCreateOrder()

  const canSubmit =
    sneakerIds.length > 0 &&
    name.trim().length >= 2 &&
    addr1.trim().length >= 3 &&
    /^\d{4,10}$/.test(postal.replace(/\s+/g, '')) &&
    city.trim().length >= 2 &&
    acceptCgv &&
    acceptCustom &&
    !createOrder.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    try {
      const response = await createOrder.mutateAsync({
        sneaker_ids: sneakerIds,
        shipping: {
          name: name.trim(),
          address_line1: addr1.trim(),
          address_line2: addr2.trim() || undefined,
          postal_code: postal.replace(/\s+/g, ''),
          city: city.trim(),
          country: 'FR',
          phone: phone.trim() || undefined,
        },
      })
      // Redirige vers Stripe Checkout
      window.location.href = response.checkout_url
    } catch (err) {
      console.error(err)
    }
  }

  if (sneakerIds.length === 0) return null

  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={pageStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>COMMANDE</h1>
          <p style={subtitleStyle}>
            {sneakerIds.length} sticker{sneakerIds.length > 1 ? 's' : ''} · {pricing.nbPlanches} planche{pricing.nbPlanches > 1 ? 's' : ''} A4
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          {/* Recap prix */}
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>RÉCAPITULATIF</h2>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={tdLabelStyle}>Stickers personnalisés</td>
                  <td style={tdValueStyle}>{sneakerIds.length}</td>
                </tr>
                <tr>
                  <td style={tdLabelStyle}>Planches A4 (8 stickers/planche)</td>
                  <td style={tdValueStyle}>{pricing.nbPlanches}</td>
                </tr>
                <tr>
                  <td style={tdLabelStyle}>Prix unitaire (tier {pricing.tier})</td>
                  <td style={tdValueStyle}>{formatEur(pricing.pricePerPlate)} / planche</td>
                </tr>
                <tr>
                  <td style={tdLabelStyle}>Livraison France métropolitaine</td>
                  <td style={tdValueStyle}>Incluse ✓</td>
                </tr>
                <tr style={trTotalStyle}>
                  <td style={tdTotalLabelStyle}>Total TTC</td>
                  <td style={tdTotalValueStyle}>{formatEur(pricing.totalAmount)}</td>
                </tr>
              </tbody>
            </table>

            {pricing.nextTier && pricing.nextTier.nbPlanchesNeeded > 0 && (
              <div style={nextTierHintStyle}>
                💡 Ajoute encore <strong>{pricing.nextTier.nbPlanchesNeeded * 8} sticker{pricing.nextTier.nbPlanchesNeeded * 8 > 1 ? 's' : ''}</strong> pour passer à{' '}
                <strong>{formatEur(pricing.nextTier.newPricePerPlate)} / planche</strong>
              </div>
            )}
          </section>

          {/* Adresse */}
          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>📦 LIVRAISON</h2>
            <div style={fieldsGridStyle}>
              <Field label="Nom et prénom *" required>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required minLength={2} />
              </Field>
              <Field label="Adresse *" required>
                <input type="text" value={addr1} onChange={(e) => setAddr1(e.target.value)} style={inputStyle} required minLength={3} placeholder="N° et rue" />
              </Field>
              <Field label="Complément (optionnel)">
                <input type="text" value={addr2} onChange={(e) => setAddr2(e.target.value)} style={inputStyle} placeholder="Appartement, étage, etc." />
              </Field>
              <Field label="Code postal *" required>
                <input type="text" value={postal} onChange={(e) => setPostal(e.target.value)} style={inputStyle} required pattern="\d{4,10}" inputMode="numeric" />
              </Field>
              <Field label="Ville *" required>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} required minLength={2} />
              </Field>
              <Field label="Téléphone (optionnel, pour suivi colis)">
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="06 12 34 56 78" />
              </Field>
            </div>
            <p style={hintStyle}>Livraison France métropolitaine uniquement pour l'instant.</p>
          </section>

          {/* Consentements */}
          <section style={cardStyle}>
            <label style={consentRowStyle}>
              <input type="checkbox" checked={acceptCgv} onChange={(e) => setAcceptCgv(e.target.checked)} style={checkboxStyle} />
              <span style={consentTextStyle}>
                J'accepte les <Link to="/cgv" target="_blank" style={linkStyle}>Conditions Générales de Vente</Link>
              </span>
            </label>
            <label style={consentRowStyle}>
              <input type="checkbox" checked={acceptCustom} onChange={(e) => setAcceptCustom(e.target.checked)} style={checkboxStyle} />
              <span style={consentTextStyle}>
                Je comprends que les stickers étant <strong>personnalisés</strong> avec ma collection, le droit de rétractation de 14 jours ne s'applique pas (art. L221-28 du Code de la consommation).
              </span>
            </label>
          </section>

          {/* CTA */}
          <div style={ctaWrapStyle}>
            {createOrder.isError && (
              <p style={errorStyle}>
                ⚠️ {(createOrder.error as Error)?.message ?? 'Une erreur est survenue'}
              </p>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              style={canSubmit ? ctaStyle : ctaDisabledStyle}
            >
              {createOrder.isPending ? 'Redirection vers Stripe…' : `💳 Payer ${formatEur(pricing.totalAmount)}`}
            </button>
            <p style={trustStyle}>
              🔒 Paiement sécurisé par Stripe · 💳 CB, Apple Pay, Google Pay
            </p>
          </div>
        </form>
      </div>
    </>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={fieldStyle}>
      <span style={fieldLabelStyle}>{label}{required && ' *'}</span>
      {children}
    </label>
  )
}

// ====== Styles ======
const pageStyle: CSSProperties = {
  maxWidth: 720, margin: '0 auto',
  padding: '24px 16px 80px',
  fontFamily: "'Outfit', sans-serif",
}
const headerStyle: CSSProperties = { marginBottom: 24 }
const titleStyle: CSSProperties = {
  fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em',
  color: '#0A0A0A', margin: 0, lineHeight: 1.05,
}
const subtitleStyle: CSSProperties = {
  fontSize: 14, color: '#6B7280', marginTop: 8,
}

const cardStyle: CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 12, padding: 20, marginBottom: 16,
}
const sectionTitleStyle: CSSProperties = {
  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#0A0A0A', margin: '0 0 16px',
}

const tableStyle: CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: 14,
}
const tdLabelStyle: CSSProperties = {
  padding: '6px 0', color: '#6B7280',
}
const tdValueStyle: CSSProperties = {
  padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#0A0A0A',
  fontVariantNumeric: 'tabular-nums',
}
const trTotalStyle: CSSProperties = {
  borderTop: '2px solid #E5E7EB',
}
const tdTotalLabelStyle: CSSProperties = {
  padding: '12px 0 0', color: '#0A0A0A', fontWeight: 700, fontSize: 15,
}
const tdTotalValueStyle: CSSProperties = {
  padding: '12px 0 0', textAlign: 'right', fontWeight: 800, color: '#CE1141',
  fontSize: 18, fontVariantNumeric: 'tabular-nums',
}
const nextTierHintStyle: CSSProperties = {
  marginTop: 12, padding: 12,
  background: '#FFF5F7', border: '1px solid #FFE4E1',
  borderRadius: 8, fontSize: 13, color: '#9F1239', lineHeight: 1.4,
}

const fieldsGridStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12,
}
const fieldStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4,
}
const fieldLabelStyle: CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.04em',
}
const inputStyle: CSSProperties = {
  padding: '10px 12px', fontSize: 14, borderRadius: 8,
  border: '1px solid #E5E7EB', fontFamily: 'inherit',
}
const hintStyle: CSSProperties = {
  marginTop: 12, fontSize: 12, color: '#9CA3AF',
}

const consentRowStyle: CSSProperties = {
  display: 'flex', alignItems: 'flex-start',
  gap: 10, padding: '8px 0', cursor: 'pointer',
}
const checkboxStyle: CSSProperties = {
  marginTop: 3, flexShrink: 0,
}
const consentTextStyle: CSSProperties = {
  fontSize: 13, color: '#374151', lineHeight: 1.5,
}
const linkStyle: CSSProperties = {
  color: '#CE1141', textDecoration: 'underline',
}

const ctaWrapStyle: CSSProperties = {
  marginTop: 16, textAlign: 'center',
}
const ctaStyle: CSSProperties = {
  background: '#CE1141', color: '#FFFFFF',
  fontSize: 16, fontWeight: 700, padding: '14px 32px',
  border: 'none', borderRadius: 999, cursor: 'pointer',
  fontFamily: 'inherit', width: '100%', maxWidth: 400,
}
const ctaDisabledStyle: CSSProperties = {
  ...ctaStyle, background: '#E5E7EB', color: '#9CA3AF', cursor: 'not-allowed',
}
const trustStyle: CSSProperties = {
  marginTop: 12, fontSize: 11, color: '#6B7280',
}
const errorStyle: CSSProperties = {
  color: '#CE1141', fontSize: 13, marginBottom: 12,
  padding: 10, background: '#FEE2E2', borderRadius: 8,
}