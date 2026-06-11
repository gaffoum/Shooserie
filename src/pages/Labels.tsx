/**
 * Labels â€” page de generation de stickers pour les boites.
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
      alert("La gÃ©nÃ©ration du PDF a Ã©chouÃ©. VÃ©rifie la console.")
    } finally {
      setIsGenerating(false)
    }
  }

  if (sneakersQ.isLoading) {
    return (
      <>
        <AppHeader leftActions={<BackButton />} />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Ã‰tiquettes</h1>
          <p style={mutedStyle}>Chargement de ta collecâ€¦</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={pageStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>Ã‰TIQUETTES</h1>
          <p style={subtitleStyle}>
            Format Avery L7165 / J8165 Â· 99 Ã— 67 mm Â· 8 par page A4
          </p>
        </header>

        {/* Preview live (toutes les paires selectionnees) */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>APERÃ‡U</h2>
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
              <div style={emptyPreviewStyle}>Aucune paire Ã  prÃ©visualiser</div>
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
            SÃ‰LECTION ({selectedSneakers.length} / {sneakers.length})
            {pagesCount > 0 && (
              <span style={pagesBadgeStyle}>
                {pagesCount} page{pagesCount > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <div style={toolbarStyle}>
            <input
              type="text"
              placeholder="Rechercher (modÃ¨le, marqueâ€¦)"
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
              Tout sÃ©lectionner
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
                ? 'GÃ©nÃ©rationâ€¦'
                : `ðŸ“„ TÃ©lÃ©charger ${selectedSneakers.length} sticker${selectedSneakers.length > 1 ? 's' : ''} en PDF`
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
                {`ðŸ“¥ Payer & tÃ©lÃ©charger (${formatEur(digitalTotal)})`}
              </button>
              <button
                type="button"
                onClick={() => goCheckout('physical')}
                disabled={selectedSneakers.length === 0}
                style={selectedSneakers.length === 0 ? ctaSecondaryDisabledStyle : ctaSecondaryStyle}
              >
                {`ðŸŽ Commander la planche imprimÃ©e (${formatEur(physicalTotal)})`}
              </button>
            </div>
          )}
          <p style={hintStyle}>
            {isAdmin
              ? 'Imprime sur planche Avery L7165 / J8165 (8 stickers par feuille A4).'
              : 'PDF : tu imprimes toi-mÃªme (dÃ¨s 5 planches : 1,50 â‚¬/planche). Planche imprimÃ©e : expÃ©diÃ©e chez toi (dÃ¨s 5 : 5 â‚¬, dÃ¨s 10 : 4 â‚¬).'}
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