# ============================================================================
#  lot2-front.ps1  —  Front du Lot 2 (tarif 2 tiers + tunnel numerique/physique)
#  Reecrit 5 fichiers :
#    src/lib/stickerPricing.ts     -> tarif digital/physical degressif
#    src/lib/stickerOrders.ts      -> type dans les commandes + useSneakersByIds
#    src/pages/Labels.tsx          -> 2 CTA non-admin (2 EUR / 6 EUR)
#    src/pages/CheckoutLabels.tsx  -> variante numerique (sans adresse + mention legale)
#    src/pages/OrderSuccess.tsx    -> telechargement du PDF apres paiement (numerique)
#  Front uniquement. A lancer depuis la RACINE du repo Shooserie.
# ============================================================================
$ErrorActionPreference = 'Stop'

function Write-FileUtf8NoBom([string]$Path, [string]$Content) {
  $dir = Split-Path -Parent $Path
  if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $enc)
  Write-Host "  ecrit : $Path" -ForegroundColor DarkGray
}

if (-not (Test-Path 'src/pages/Labels.tsx')) {
  Write-Host "ERREUR : lance depuis la racine du repo Shooserie." -ForegroundColor Red
  exit 1
}

Write-Host "== Lot 2 front : reecriture des 5 fichiers ==" -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# 1) src/lib/stickerPricing.ts
# ---------------------------------------------------------------------------
$pricing = @'
/**
 * Pricing des commandes de stickers — deux types :
 *   - 'physical' (planche imprimee + expediee) : degressif
 *       1-4 planches : 6 EUR · 5-9 : 5 EUR · 10+ : 4 EUR (plancher)
 *   - 'digital' (PDF a telecharger) : degressif
 *       1-4 planches : 2 EUR · 5+ : 1.50 EUR
 * Prix PAR PLANCHE applique a toutes les planches selon le palier atteint.
 */

export type OrderType = 'digital' | 'physical'

export const STICKERS_PER_PLATE = 8

export function calculateNbPlanches(nbStickers: number): number {
  if (nbStickers <= 0) return 0
  return Math.ceil(nbStickers / STICKERS_PER_PLATE)
}

export function pricePerPlate(nbPlanches: number, type: OrderType): number {
  if (type === 'digital') return nbPlanches >= 5 ? 1.5 : 2
  if (nbPlanches >= 10) return 4
  if (nbPlanches >= 5) return 5
  return 6
}

export interface PricingResult {
  type: OrderType
  nbStickers: number
  nbPlanches: number
  pricePerPlate: number
  totalAmount: number
  /** nb de planches a ajouter pour baisser le prix unitaire + nouveau prix */
  nextTier?: {
    nbPlanchesNeeded: number
    newPricePerPlate: number
  }
}

export function calculatePricing(nbStickers: number, type: OrderType = 'physical'): PricingResult {
  const nbPlanches = calculateNbPlanches(nbStickers)
  const price = pricePerPlate(nbPlanches, type)
  const total = nbPlanches * price

  let nextTier: PricingResult['nextTier']
  for (let extra = 1; extra <= 50; extra++) {
    const np = nbPlanches + extra
    const newPrice = pricePerPlate(np, type)
    if (newPrice < price) {
      nextTier = { nbPlanchesNeeded: extra, newPricePerPlate: newPrice }
      break
    }
  }

  return {
    type,
    nbStickers,
    nbPlanches,
    pricePerPlate: price,
    totalAmount: total,
    nextTier,
  }
}

/** Formatte un montant EUR avec 2 decimales et symbole. */
export function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}
'@
Write-FileUtf8NoBom -Path 'src/lib/stickerPricing.ts' -Content $pricing

# ---------------------------------------------------------------------------
# 2) src/lib/stickerOrders.ts
# ---------------------------------------------------------------------------
$orders = @'
/**
 * Hooks queries pour les commandes de stickers.
 */
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { OrderType } from './stickerPricing'
import type { StickerSneaker } from './stickerPdf'
export { formatEur } from './stickerPricing'

export interface StickerOrder {
  id: string
  user_id: string
  type: OrderType
  sneaker_ids: string[]
  nb_stickers: number
  nb_planches: number
  price_per_plate_cents: number
  amount_total_cents: number
  currency: string
  shipping_name: string | null
  shipping_address_line1: string | null
  shipping_address_line2: string | null
  shipping_postal_code: string | null
  shipping_city: string | null
  shipping_country: string | null
  shipping_phone: string | null
  stripe_session_id: string | null
  status: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  carrier: string | null
  tracking_number: string | null
  tracking_url: string | null
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  created_at: string
}

export interface CreateOrderInput {
  sneaker_ids: string[]
  type: OrderType
  shipping?: {
    name: string
    address_line1: string
    address_line2?: string
    postal_code: string
    city: string
    country?: string
    phone?: string
  }
}

interface CreateOrderResponse {
  order_id: string
  checkout_url: string
  amount_total_cents: number
  nb_planches: number
}

/** Lance la creation d'une commande + redirige vers Stripe Checkout. */
export function useCreateOrder() {
  return useMutation({
    mutationFn: async (input: CreateOrderInput): Promise<CreateOrderResponse> => {
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) throw new Error('Non authentifie')

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-sticker-order`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })

      const body = await response.json()
      if (!response.ok) {
        throw new Error(body?.error ?? `HTTP ${response.status}`)
      }
      return body as CreateOrderResponse
    },
  })
}

/** Liste les commandes de l'utilisateur courant. */
export function useMyOrders() {
  return useQuery({
    queryKey: ['my-sticker-orders'],
    queryFn: async (): Promise<StickerOrder[]> => {
      const { data, error } = await supabase
        .from('sticker_orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as StickerOrder[]
    },
    staleTime: 30 * 1000,
  })
}

/** Fetch une commande specifique (par id). */
export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['sticker-order', orderId],
    queryFn: async (): Promise<StickerOrder | null> => {
      if (!orderId) return null
      const { data, error } = await supabase
        .from('sticker_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle()
      if (error) throw error
      return data as StickerOrder | null
    },
    enabled: !!orderId,
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      const d = query.state.data as StickerOrder | null | undefined
      if (d && d.status === 'pending') return 2000
      return false
    },
  })
}

/** Recupere les paires (champs sticker) par ids, en preservant l'ordre demande. */
export function useSneakersByIds(ids: string[] | undefined) {
  return useQuery({
    queryKey: ['sneakers-by-ids', (ids ?? []).slice().sort().join(',')],
    queryFn: async (): Promise<StickerSneaker[]> => {
      if (!ids || ids.length === 0) return []
      const { data, error } = await supabase
        .from('sneakers')
        .select('id, name, brand, colorway, size_eu, size_us, stockx_image_url, photo_url')
        .in('id', ids)
      if (error) throw error
      const rows = (data ?? []) as StickerSneaker[]
      const byId = new Map(rows.map((r) => [r.id, r]))
      return ids
        .map((id) => byId.get(id))
        .filter((x): x is StickerSneaker => Boolean(x))
    },
    enabled: !!ids && ids.length > 0,
    staleTime: 60 * 1000,
  })
}

/** Helper pour le label d'un statut. */
export function statusLabel(status: StickerOrder['status']): string {
  const map: Record<StickerOrder['status'], string> = {
    pending: 'En attente de paiement',
    paid: 'Payée',
    preparing: 'En préparation',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    refunded: 'Remboursée',
  }
  return map[status] ?? status
}

/** Helper couleur statut. */
export function statusColor(status: StickerOrder['status']): { bg: string; fg: string } {
  switch (status) {
    case 'pending':    return { bg: '#FEF3C7', fg: '#92400E' }
    case 'paid':       return { bg: '#DBEAFE', fg: '#1E40AF' }
    case 'preparing':  return { bg: '#E0E7FF', fg: '#3730A3' }
    case 'shipped':    return { bg: '#D1FAE5', fg: '#065F46' }
    case 'delivered':  return { bg: '#D1FAE5', fg: '#065F46' }
    case 'cancelled':  return { bg: '#FEE2E2', fg: '#991B1B' }
    case 'refunded':   return { bg: '#FCE7F3', fg: '#9F1239' }
  }
}
'@
Write-FileUtf8NoBom -Path 'src/lib/stickerOrders.ts' -Content $orders

# ---------------------------------------------------------------------------
# 3) src/pages/Labels.tsx  (seul le bloc CTA non-admin change + 1 style)
# ---------------------------------------------------------------------------
$labels = @'
/**
 * Labels — page de generation de stickers pour les boites.
 * Format Avery L7165 / J8165 : 99x67mm, 8 par page A4.
 */
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { calculatePricing, formatEur } from '../lib/stickerPricing'
import { useQuery } from '@tanstack/react-query'
import type { CSSProperties } from 'react'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { SneakerSelectCard } from '../components/SneakerSelectCard'
import { StickerPreview } from '../components/StickerPreview'
import { useAuth } from '../contexts/AuthContext'
import { ADMIN_EMAIL } from '../lib/queries'
import { supabase } from '../lib/supabase'
import {
  generateStickerPdf,
  downloadBlob,
  type StickerSneaker,
  type StickerOptions,
} from '../lib/stickerPdf'

const DEFAULT_OPTIONS: StickerOptions = {
  showPhoto: true,
  showSize: true,
  showQR: true,
  showBrandBar: true,
  qrBaseUrl: 'https://shooserie.tech/sneakers',
}

function useMySneakersForLabels() {
  return useQuery({
    queryKey: ['my-sneakers-labels'],
    queryFn: async (): Promise<StickerSneaker[]> => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) return []
      const { data, error } = await supabase
        .from('sneakers')
        .select('id, name, brand, colorway, size_eu, size_us, stockx_image_url, photo_url')
        .eq('user_id', userId)
        .order('brand', { ascending: true })
        .order('name', { ascending: true })
      if (error) throw error
      return (data ?? []) as StickerSneaker[]
    },
    staleTime: 60 * 1000,
  })
}

export default function Labels() {
  const navigate = useNavigate()
  const sneakersQ = useMySneakersForLabels()
  const sneakers = sneakersQ.data ?? []
  const { session } = useAuth()
  const isAdmin = session?.user.email === ADMIN_EMAIL

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [options, setOptions] = useState<StickerOptions>(DEFAULT_OPTIONS)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [isGenerating, setIsGenerating] = useState(false)

  const brands = useMemo(() => {
    const set = new Set<string>()
    for (const s of sneakers) if (s.brand) set.add(s.brand)
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))
  }, [sneakers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sneakers.filter((s) => {
      if (brandFilter !== 'all' && s.brand !== brandFilter) return false
      if (q && !`${s.name} ${s.brand ?? ''} ${s.colorway ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [sneakers, brandFilter, search])

  const selectedSneakers = useMemo(
    () => sneakers.filter((s) => selected.has(s.id)),
    [sneakers, selected],
  )

  const pagesCount = Math.ceil(selectedSneakers.length / 8)
  const digitalTotal = calculatePricing(selectedSneakers.length, 'digital').totalAmount
  const physicalTotal = calculatePricing(selectedSneakers.length, 'physical').totalAmount

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filtered.map((s) => s.id)))
  }

  function selectNone() {
    setSelected(new Set())
  }

  function goCheckout(type: 'digital' | 'physical') {
    if (selectedSneakers.length === 0) return
    navigate('/checkout-labels', {
      state: { sneakerIds: selectedSneakers.map((s) => s.id), type },
    })
  }

  async function handleGenerate() {
    if (selectedSneakers.length === 0) return
    setIsGenerating(true)
    try {
      const blob = await generateStickerPdf(selectedSneakers, options)
      const filename = `shooserie-stickers-${new Date().toISOString().slice(0, 10)}.pdf`
      downloadBlob(blob, filename)
    } catch (err) {
      console.error('PDF generation failed', err)
      alert("La génération du PDF a échoué. Vérifie la console.")
    } finally {
      setIsGenerating(false)
    }
  }

  if (sneakersQ.isLoading) {
    return (
      <>
        <AppHeader leftActions={<BackButton />} />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Étiquettes</h1>
          <p style={mutedStyle}>Chargement de ta collec…</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={pageStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>ÉTIQUETTES</h1>
          <p style={subtitleStyle}>
            Format Avery L7165 / J8165 · 99 × 67 mm · 8 par page A4
          </p>
        </header>

        {/* Preview live (toutes les paires selectionnees) */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>APERÇU</h2>
          <div style={previewWrapStyle}>
            {selectedSneakers.length > 0 ? (
              <div style={sheetGridStyle}>
                {selectedSneakers.map((s) => (
                  <StickerPreview key={s.id} sneaker={s} options={options} scale={1.1} />
                ))}
              </div>
            ) : filtered[0] ? (
              <StickerPreview sneaker={filtered[0]} options={options} scale={1.4} />
            ) : (
              <div style={emptyPreviewStyle}>Aucune paire à prévisualiser</div>
            )}
          </div>
        </section>

        {/* Options */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>OPTIONS</h2>
          <div style={optionsRowStyle}>
            <OptionToggle
              checked={options.showPhoto}
              onChange={(v) => setOptions({ ...options, showPhoto: v })}
              label="Photo"
            />
            <OptionToggle
              checked={options.showSize}
              onChange={(v) => setOptions({ ...options, showSize: v })}
              label="Taille"
            />
            <OptionToggle
              checked={options.showQR}
              onChange={(v) => setOptions({ ...options, showQR: v })}
              label="QR code"
            />
            <OptionToggle
              checked={options.showBrandBar}
              onChange={(v) => setOptions({ ...options, showBrandBar: v })}
              label="Bande marque"
            />
          </div>
        </section>

        {/* Toolbar */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            SÉLECTION ({selectedSneakers.length} / {sneakers.length})
            {pagesCount > 0 && (
              <span style={pagesBadgeStyle}>
                {pagesCount} page{pagesCount > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <div style={toolbarStyle}>
            <input
              type="text"
              placeholder="Rechercher (modèle, marque…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              style={selectStyle}
            >
              <option value="all">Toutes les marques</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <button type="button" onClick={selectAll} style={ghostBtnStyle}>
              Tout sélectionner
            </button>
            <button type="button" onClick={selectNone} style={ghostBtnStyle}>
              Aucun
            </button>
          </div>

          <div style={cardsGridStyle}>
            {filtered.map((s) => (
              <SneakerSelectCard
                key={s.id}
                id={s.id}
                name={s.name}
                brand={s.brand}
                photoUrl={s.stockx_image_url || s.photo_url}
                selected={selected.has(s.id)}
                onToggle={toggle}
              />
            ))}
          </div>
        </section>

        {/* CTA */}
        <div style={ctaWrapStyle}>
          {isAdmin && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={selectedSneakers.length === 0 || isGenerating}
              style={selectedSneakers.length === 0 || isGenerating ? ctaDisabledStyle : ctaStyle}
            >
              {isGenerating
                ? 'Génération…'
                : `📄 Télécharger ${selectedSneakers.length} sticker${selectedSneakers.length > 1 ? 's' : ''} en PDF`
              }
            </button>
          )}

          {!isAdmin && (
            <div style={ctaDualStyle}>
              <button
                type="button"
                onClick={() => goCheckout('digital')}
                disabled={selectedSneakers.length === 0}
                style={selectedSneakers.length === 0 ? ctaDisabledStyle : ctaStyle}
              >
                {`📥 Payer & télécharger (${formatEur(digitalTotal)})`}
              </button>
              <button
                type="button"
                onClick={() => goCheckout('physical')}
                disabled={selectedSneakers.length === 0}
                style={selectedSneakers.length === 0 ? ctaSecondaryDisabledStyle : ctaSecondaryStyle}
              >
                {`🎁 Commander la planche imprimée (${formatEur(physicalTotal)})`}
              </button>
            </div>
          )}
          <p style={hintStyle}>
            {isAdmin
              ? 'Imprime sur planche Avery L7165 / J8165 (8 stickers par feuille A4).'
              : 'PDF : tu imprimes toi-même (dès 5 planches : 1,50 €/planche). Planche imprimée : expédiée chez toi (dès 5 : 5 €, dès 10 : 4 €).'}
          </p>
        </div>
      </div>
    </>
  )
}

function OptionToggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={toggleLabelStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ marginRight: 6 }}
      />
      {label}
    </label>
  )
}

// =================================================================
// Styles
// =================================================================
const pageStyle: CSSProperties = {
  maxWidth: 900, margin: '0 auto',
  padding: '24px 16px 80px',
  fontFamily: "'Outfit', sans-serif",
}
const headerStyle: CSSProperties = { marginBottom: 24 }
const titleStyle: CSSProperties = {
  fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em',
  color: '#0A0A0A', margin: 0, lineHeight: 1.05,
}
const subtitleStyle: CSSProperties = {
  fontSize: 13, color: '#6B7280', marginTop: 8,
}
const mutedStyle: CSSProperties = { color: '#6B7280', fontSize: 13 }

const sectionStyle: CSSProperties = { marginBottom: 28 }
const sectionTitleStyle: CSSProperties = {
  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#0A0A0A', margin: '0 0 12px',
  display: 'flex', alignItems: 'center', gap: 8,
}
const pagesBadgeStyle: CSSProperties = {
  marginLeft: 8, fontSize: 11, color: '#6B7280',
  fontWeight: 500, letterSpacing: 'normal', textTransform: 'none',
}

const previewWrapStyle: CSSProperties = {
  display: 'flex', justifyContent: 'center', padding: 16,
  background: '#F9FAFB', borderRadius: 10, border: '1px solid #E5E7EB',
}
const sheetGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  width: '100%',
}
const emptyPreviewStyle: CSSProperties = {
  padding: 60, color: '#9CA3AF', fontSize: 13,
}

const optionsRowStyle: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 12,
  padding: 14, background: '#FFFFFF', borderRadius: 10,
  border: '1px solid #E5E7EB',
}
const toggleLabelStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  fontSize: 13, color: '#0A0A0A', cursor: 'pointer',
}

const toolbarStyle: CSSProperties = {
  display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12,
}
const inputStyle: CSSProperties = {
  flex: '1 1 200px',
  padding: '8px 12px', fontSize: 13, borderRadius: 8,
  border: '1px solid #E5E7EB', fontFamily: 'inherit',
}
const selectStyle: CSSProperties = {
  padding: '8px 12px', fontSize: 13, borderRadius: 8,
  border: '1px solid #E5E7EB', background: '#FFFFFF',
  fontFamily: 'inherit',
}
const ghostBtnStyle: CSSProperties = {
  padding: '8px 14px', fontSize: 12, fontWeight: 600,
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 8, color: '#0A0A0A', cursor: 'pointer',
  fontFamily: 'inherit',
}

const cardsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: 12,
}

const ctaWrapStyle: CSSProperties = {
  position: 'sticky', bottom: 0,
  background: 'rgba(249, 250, 251, 0.95)',
  backdropFilter: 'blur(8px)',
  padding: '16px 0',
  marginTop: 24,
  borderTop: '1px solid #E5E7EB',
  textAlign: 'center',
}
const ctaDualStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8,
  maxWidth: 420, marginInline: 'auto',
}
const ctaStyle: CSSProperties = {
  background: '#CE1141', color: '#FFFFFF',
  fontSize: 15, fontWeight: 700,
  padding: '14px 32px', border: 'none',
  borderRadius: 999, cursor: 'pointer',
  fontFamily: 'inherit', letterSpacing: '0.01em',
}
const ctaDisabledStyle: CSSProperties = {
  ...ctaStyle,
  background: '#E5E7EB', color: '#9CA3AF', cursor: 'not-allowed',
}
const hintStyle: CSSProperties = {
  marginTop: 10, fontSize: 11, color: '#6B7280',
  maxWidth: 420, marginInline: 'auto',
}

const ctaSecondaryStyle: CSSProperties = {
  background: '#FFFFFF',
  color: '#CE1141',
  fontSize: 15,
  fontWeight: 700,
  padding: '14px 32px',
  border: '2px solid #CE1141',
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: 'inherit',
  letterSpacing: '0.01em',
}

const ctaSecondaryDisabledStyle: CSSProperties = {
  ...ctaSecondaryStyle,
  color: '#9CA3AF',
  borderColor: '#E5E7EB',
  cursor: 'not-allowed',
}
'@
Write-FileUtf8NoBom -Path 'src/pages/Labels.tsx' -Content $labels

# ---------------------------------------------------------------------------
# 4) src/pages/CheckoutLabels.tsx
# ---------------------------------------------------------------------------
$checkout = @'
/**
 * CheckoutLabels — commande de stickers (numerique OU physique).
 * Le `type` arrive via location.state depuis /labels.
 *   - digital  : pas d'adresse, mention legale de renonciation a la retractation,
 *                bouton "Payer & telecharger" (le PDF se telecharge sur la page succes).
 *   - physical : adresse de livraison + mention "personnalise", bouton "Payer".
 */
import type { CSSProperties, FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { useCreateOrder } from '../lib/stickerOrders'
import { calculatePricing, formatEur, type OrderType } from '../lib/stickerPricing'

interface LocationState {
  sneakerIds?: string[]
  type?: OrderType
}

export default function CheckoutLabels() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as LocationState | null
  const sneakerIds = state?.sneakerIds ?? []
  const type: OrderType = state?.type === 'digital' ? 'digital' : 'physical'
  const isDigital = type === 'digital'

  useEffect(() => {
    if (sneakerIds.length === 0) {
      navigate('/labels', { replace: true })
    }
  }, [sneakerIds.length, navigate])

  const pricing = useMemo(() => calculatePricing(sneakerIds.length, type), [sneakerIds.length, type])

  const [name, setName] = useState('')
  const [addr1, setAddr1] = useState('')
  const [addr2, setAddr2] = useState('')
  const [postal, setPostal] = useState('')
  const [city, setCity] = useState('')
  const [phone, setPhone] = useState('')
  const [acceptCgv, setAcceptCgv] = useState(false)
  const [acceptCustom, setAcceptCustom] = useState(false)

  const createOrder = useCreateOrder()

  const addressOk =
    name.trim().length >= 2 &&
    addr1.trim().length >= 3 &&
    /^\d{4,10}$/.test(postal.replace(/\s+/g, '')) &&
    city.trim().length >= 2

  const canSubmit =
    sneakerIds.length > 0 &&
    (isDigital || addressOk) &&
    acceptCgv &&
    acceptCustom &&
    !createOrder.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    try {
      const response = await createOrder.mutateAsync({
        sneaker_ids: sneakerIds,
        type,
        shipping: isDigital
          ? undefined
          : {
              name: name.trim(),
              address_line1: addr1.trim(),
              address_line2: addr2.trim() || undefined,
              postal_code: postal.replace(/\s+/g, ''),
              city: city.trim(),
              country: 'FR',
              phone: phone.trim() || undefined,
            },
      })
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
          <h1 style={titleStyle}>{isDigital ? 'TÉLÉCHARGEMENT' : 'COMMANDE'}</h1>
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
                  <td style={tdLabelStyle}>Prix unitaire</td>
                  <td style={tdValueStyle}>{formatEur(pricing.pricePerPlate)} / planche</td>
                </tr>
                <tr>
                  <td style={tdLabelStyle}>{isDigital ? 'Format' : 'Livraison France métropolitaine'}</td>
                  <td style={tdValueStyle}>{isDigital ? 'PDF immédiat ✓' : 'Incluse ✓'}</td>
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

          {/* Adresse (physique uniquement) */}
          {!isDigital && (
            <section style={cardStyle}>
              <h2 style={sectionTitleStyle}>📦 LIVRAISON</h2>
              <div style={fieldsGridStyle}>
                <Field label="Nom et prénom" required>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} required minLength={2} />
                </Field>
                <Field label="Adresse" required>
                  <input type="text" value={addr1} onChange={(e) => setAddr1(e.target.value)} style={inputStyle} required minLength={3} placeholder="N° et rue" />
                </Field>
                <Field label="Complément (optionnel)">
                  <input type="text" value={addr2} onChange={(e) => setAddr2(e.target.value)} style={inputStyle} placeholder="Appartement, étage, etc." />
                </Field>
                <Field label="Code postal" required>
                  <input type="text" value={postal} onChange={(e) => setPostal(e.target.value)} style={inputStyle} required pattern="\d{4,10}" inputMode="numeric" />
                </Field>
                <Field label="Ville" required>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} style={inputStyle} required minLength={2} />
                </Field>
                <Field label="Téléphone (optionnel, pour suivi colis)">
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} placeholder="06 12 34 56 78" />
                </Field>
              </div>
              <p style={hintStyle}>Livraison France métropolitaine uniquement pour l'instant.</p>
            </section>
          )}

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
                {isDigital ? (
                  <>Je demande la fourniture immédiate du PDF et je reconnais perdre mon droit de rétractation dès que le téléchargement est disponible (art. L221-28 du Code de la consommation).</>
                ) : (
                  <>Je comprends que les stickers étant <strong>personnalisés</strong> avec ma collection, le droit de rétractation de 14 jours ne s'applique pas (art. L221-28 du Code de la consommation).</>
                )}
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
              {createOrder.isPending
                ? 'Redirection vers Stripe…'
                : isDigital
                  ? `💳 Payer & télécharger ${formatEur(pricing.totalAmount)}`
                  : `💳 Payer ${formatEur(pricing.totalAmount)}`}
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
'@
Write-FileUtf8NoBom -Path 'src/pages/CheckoutLabels.tsx' -Content $checkout

# ---------------------------------------------------------------------------
# 5) src/pages/OrderSuccess.tsx
# ---------------------------------------------------------------------------
$success = @'
/**
 * OrderSuccess — page de retour apres paiement Stripe.
 * On poll la commande jusqu'a ce que le webhook ait marque "paid".
 * Si la commande est numerique et payee, on permet le telechargement du PDF
 * (genere cote client a partir des paires de la commande).
 */
import type { CSSProperties } from 'react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppHeader } from '../components/AppHeader'
import { useOrder, useSneakersByIds, formatEur, statusLabel } from '../lib/stickerOrders'
import { generateStickerPdf, downloadBlob } from '../lib/stickerPdf'

const PDF_OPTIONS = {
  showPhoto: true,
  showSize: true,
  showQR: true,
  showBrandBar: true,
  qrBaseUrl: 'https://shooserie.tech/sneakers',
}

export default function OrderSuccess() {
  const { id } = useParams<{ id: string }>()
  const orderQ = useOrder(id)
  const order = orderQ.data ?? null

  const canDownload = !!order && order.type === 'digital' && order.status !== 'pending'
  const sneakersQ = useSneakersByIds(canDownload ? order!.sneaker_ids : undefined)
  const [isGen, setIsGen] = useState(false)

  async function handleDownload() {
    if (!order) return
    const sneakers = sneakersQ.data ?? []
    if (sneakers.length === 0) {
      alert('Impossible de retrouver les paires de cette commande.')
      return
    }
    setIsGen(true)
    try {
      const blob = await generateStickerPdf(sneakers, PDF_OPTIONS)
      downloadBlob(blob, `shooserie-stickers-${order.id.slice(0, 8)}.pdf`)
    } catch (e) {
      console.error('PDF generation failed', e)
      alert('La génération du PDF a échoué. Réessaie.')
    } finally {
      setIsGen(false)
    }
  }

  if (orderQ.isLoading) {
    return (
      <>
        <AppHeader />
        <div style={pageStyle}>
          <p style={mutedStyle}>Chargement…</p>
        </div>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <AppHeader />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Commande introuvable</h1>
          <Link to="/orders" style={linkStyle}>← Mes commandes</Link>
        </div>
      </>
    )
  }

  const isPending = order.status === 'pending'
  const isDigital = order.type === 'digital'

  return (
    <>
      <AppHeader />
      <div style={pageStyle}>
        {isPending ? (
          <div style={pendingBoxStyle}>
            <div style={spinnerStyle}>⏳</div>
            <h1 style={titleStyle}>Paiement en cours de confirmation…</h1>
            <p style={mutedStyle}>
              Stripe est en train de confirmer ton paiement. Cette page se met à jour automatiquement (max 30 sec).
            </p>
          </div>
        ) : (
          <div style={successBoxStyle}>
            <div style={emojiStyle}>🎉</div>
            <h1 style={titleStyle}>{isDigital ? 'Paiement confirmé !' : 'Commande confirmée !'}</h1>
            <p style={subtitleStyle}>
              Merci pour ta confiance. Un email de confirmation t'a été envoyé.
            </p>

            <div style={cardStyle}>
              <table style={tableStyle}>
                <tbody>
                  <tr>
                    <td style={tdLabelStyle}>Numéro de commande</td>
                    <td style={tdValueStyle}>#{order.id.slice(0, 8).toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Type</td>
                    <td style={tdValueStyle}>{isDigital ? 'PDF numérique' : 'Planche imprimée'}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Stickers</td>
                    <td style={tdValueStyle}>{order.nb_stickers}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Planches</td>
                    <td style={tdValueStyle}>{order.nb_planches}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Total payé</td>
                    <td style={tdValueStyle}>{formatEur(order.amount_total_cents / 100)}</td>
                  </tr>
                  <tr>
                    <td style={tdLabelStyle}>Statut</td>
                    <td style={tdValueStyle}>{statusLabel(order.status)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {isDigital ? (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isGen || sneakersQ.isLoading}
                  style={isGen || sneakersQ.isLoading ? downloadDisabledStyle : downloadStyle}
                >
                  {isGen
                    ? 'Génération du PDF…'
                    : sneakersQ.isLoading
                      ? 'Préparation…'
                      : '📥 Télécharger mon PDF'}
                </button>
                <p style={nextStepStyle}>
                  Tu peux retélécharger ton PDF à tout moment depuis cette page ou « Mes commandes ».
                </p>
              </>
            ) : (
              <p style={nextStepStyle}>
                📦 Tes planches sont en cours de préparation. Tu recevras un mail avec le numéro de suivi sous 3-5 jours ouvrés.
              </p>
            )}

            <div style={ctaWrapStyle}>
              <Link to="/orders" style={primaryCtaStyle}>Voir mes commandes</Link>
              <Link to="/labels" style={secondaryCtaStyle}>Retour aux étiquettes</Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const pageStyle: CSSProperties = {
  maxWidth: 600, margin: '0 auto',
  padding: '40px 16px 80px',
  fontFamily: "'Outfit', sans-serif",
  textAlign: 'center',
}
const successBoxStyle: CSSProperties = {}
const pendingBoxStyle: CSSProperties = { padding: '40px 0' }
const spinnerStyle: CSSProperties = {
  fontSize: 48, marginBottom: 16,
  animation: 'spin 2s linear infinite',
}
const emojiStyle: CSSProperties = { fontSize: 56, marginBottom: 16 }
const titleStyle: CSSProperties = {
  fontSize: 28, fontWeight: 800, color: '#0A0A0A',
  margin: '0 0 8px', lineHeight: 1.2,
}
const subtitleStyle: CSSProperties = {
  fontSize: 15, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.5,
}
const mutedStyle: CSSProperties = { color: '#6B7280', fontSize: 14 }

const cardStyle: CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 12, padding: 20, marginBottom: 16, textAlign: 'left',
}
const tableStyle: CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: 14,
}
const tdLabelStyle: CSSProperties = { padding: '6px 0', color: '#6B7280' }
const tdValueStyle: CSSProperties = {
  padding: '6px 0', textAlign: 'right', fontWeight: 600, color: '#0A0A0A',
  fontVariantNumeric: 'tabular-nums',
}

const downloadStyle: CSSProperties = {
  background: '#CE1141', color: '#FFFFFF', border: 'none',
  borderRadius: 999, padding: '14px 28px', fontSize: 15, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'inherit', margin: '8px 0',
}
const downloadDisabledStyle: CSSProperties = {
  ...downloadStyle, background: '#E5E7EB', color: '#9CA3AF', cursor: 'not-allowed',
}

const nextStepStyle: CSSProperties = {
  fontSize: 14, color: '#374151', lineHeight: 1.5,
  background: '#F9FAFB', padding: 16, borderRadius: 10, margin: '16px 0',
}

const ctaWrapStyle: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginTop: 24,
}
const primaryCtaStyle: CSSProperties = {
  display: 'inline-block', padding: '12px 24px',
  background: '#0A0A0A', color: '#FFFFFF',
  borderRadius: 999, textDecoration: 'none',
  fontWeight: 700, fontSize: 14,
}
const secondaryCtaStyle: CSSProperties = {
  display: 'inline-block', padding: '8px 16px',
  color: '#6B7280', textDecoration: 'none', fontSize: 13,
}
const linkStyle: CSSProperties = { color: '#CE1141', textDecoration: 'underline' }
'@
Write-FileUtf8NoBom -Path 'src/pages/OrderSuccess.tsx' -Content $success

Get-ChildItem -Path 'src/lib/stickerPricing.ts','src/lib/stickerOrders.ts','src/pages/Labels.tsx','src/pages/CheckoutLabels.tsx','src/pages/OrderSuccess.tsx' -File | Unblock-File

Write-Host ""
Write-Host "OK - 5 fichiers reecrits (front Lot 2)." -ForegroundColor Green
Write-Host ""
Write-Host "Etapes :" -ForegroundColor Yellow
Write-Host "  git branch                 # * dev"
Write-Host "  git add -A"
Write-Host "  git commit -m ""feat(labels): tunnel 2 tiers numerique/physique (lot 2 front)"""
Write-Host "  git push origin dev"
Write-Host ""
Write-Host "Le tunnel ne marchera de bout en bout qu'une fois les 2 secrets Stripe poses." -ForegroundColor Yellow
