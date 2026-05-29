import { useState, type FormEvent, type CSSProperties, useEffect, useRef } from 'react'
import type { Sneaker } from '@/lib/types'
import type { SneakerInput } from '@/lib/queries'
import { uploadSneakerPhoto, useSignedPhotoUrl } from '@/lib/queries'
import type { StockXProduct } from '@/lib/stockx'
import { useT } from '@/i18n/I18nContext'
import { PhotoPlaceholder } from './PhotoPlaceholder'
import { ScanButton } from './ScanButton'
import { StockXSearch } from './StockXSearch'
import { TagsInput } from './TagsInput'

interface SneakerFormProps {
  /** Données initiales pour édition, undefined pour création */
  initial?: Sneaker
  /** Valeurs partielles pré-remplies en mode création (ex: depuis un scan) */
  defaults?: Partial<SneakerInput>
  onSubmit: (input: SneakerInput) => Promise<void> | void
  submitting?: boolean
  submitLabel?: string
}

// Internal condition codes stored in DB. Labels translated at render time.
const CONDITIONS = ['DS', 'VNDS', 'Porté', 'Très porté'] as const
const BRANDS = ['Nike', 'Air Jordan', 'Adidas', 'New Balance', 'Puma', 'ASICS', 'Yeezy', 'Autre']

// Dictionary keys for condition labels (stored values stay French for DB compat).
const CONDITION_LABELS: Record<(typeof CONDITIONS)[number], string> = {
  DS: 'form.condition.DS',
  VNDS: 'form.condition.VNDS',
  'Porté': 'form.condition.worn',
  'Très porté': 'form.condition.heavyWorn',
}

export function SneakerForm({
  initial,
  defaults,
  onSubmit,
  submitting,
  submitLabel,
}: SneakerFormProps) {
  const { t } = useT()
  const [state, setState] = useState<SneakerInput>(() => initialState(initial, defaults))
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [lookupSource, setLookupSource] = useState<string | null>(null)
  const [stockxFilled, setStockxFilled] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Si on bascule entre paires dans une session, on resync l'état
  useEffect(() => {
    if (initial) setState(initialState(initial, undefined))
  }, [initial])

  const set = <K extends keyof SneakerInput>(key: K, val: SneakerInput[K]) =>
    setState((s) => ({ ...s, [key]: val }))

  /**
   * When the user picks a product from the StockX search dropdown, we fill
   * every catalog field. We do NOT touch user-specific fields (size, purchase
   * info, photo, condition, notes) — those are personal to each pair.
   * Existing values are overwritten only if they're empty, so a user who
   * already typed something doesn't lose their input.
   */
  const handleStockXPick = (product: StockXProduct) => {
    setState((s) => ({
      ...s,
      // Always overwrite: these come from a definitive catalog source
      stockx_product_id: product.productId,
      stockx_url: product.stockxUrl,
      stockx_image_url: product.imageUrl,
      // Only fill if empty (preserve any manual edits the user made first)
      name: s.name.trim() ? s.name : product.title,
      brand: s.brand?.trim() ? s.brand : normalizeBrand(product.brand),
      colorway: s.colorway?.trim() ? s.colorway : product.colorway,
      sku: s.sku?.trim() ? s.sku : product.styleId,
      release_date: s.release_date ?? product.releaseDate,
      release_price:
        s.release_price !== null ? s.release_price : product.retailPrice,
    }))
    setStockxFilled(true)
    setLookupSource(null)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const { path } = await uploadSneakerPhoto(file)
      set('photo_url', path)
    } catch (err) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!state.name.trim()) {
      setSubmitError(t('form.errors.nameRequired'))
      return
    }
    setSubmitError(null)
    try {
      await onSubmit({
        ...state,
        name: state.name.trim(),
        brand: state.brand?.trim() || null,
        colorway: state.colorway?.trim() || null,
        sku: state.sku?.trim() || null,
        size_eu: state.size_eu?.trim() || null,
        size_us: state.size_us?.trim() || null,
        notes: state.notes?.trim() || null,
        stockx_url: state.stockx_url?.trim() || null,
        stockx_image_url: state.stockx_image_url?.trim() || null,
      })
    } catch (err) {
      setSubmitError((err as Error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={formStyle} noValidate>
      {/* Catalog search — auto-fills catalog fields */}
      <Section title={t('form.section.autofill')}>
        <StockXSearch onPick={handleStockXPick} />
        {stockxFilled && (
          <p style={stockxBadgeStyle}>{t('form.autoFilled')}</p>
        )}
      </Section>

      {/* Photo */}
      <Section title={t('form.section.photo')}>
        <PhotoField
          path={state.photo_url}
          uploading={uploading}
          onPickFile={() => fileRef.current?.click()}
          onClear={() => set('photo_url', null)}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {uploadError && <p style={errorTextStyle}>{uploadError}</p>}
      </Section>

      {/* Identité */}
      <Section title={t('form.section.identity')}>
        <Field label={`${t('form.field.name')} *`} required>
          <input
            type="text"
            required
            value={state.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Air Jordan 1 Retro High OG « Chicago »"
            style={inputStyle}
          />
        </Field>
        <Row>
          <Field label={t('form.field.brand')}>
            <select
              value={state.brand ?? ''}
              onChange={(e) => set('brand', e.target.value || null)}
              style={inputStyle}
            >
              <option value="">—</option>
              {BRANDS.map((b) => (
                <option key={b} value={b}>{b === 'Autre' ? t('form.brand.other') : b}</option>
              ))}
            </select>
          </Field>
          <Field label={t('form.field.colorway')}>
            <input
              type="text"
              value={state.colorway ?? ''}
              onChange={(e) => set('colorway', e.target.value)}
              placeholder="Chicago, Bred…"
              style={inputStyle}
            />
          </Field>
        </Row>
        <Field label={t('form.field.sku')}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={state.sku ?? ''}
              onChange={(e) => set('sku', e.target.value)}
              placeholder="DZ5485-612"
              style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
            />
            <ScanButton
              variant="compact"
              onScan={(result) => {
                const looksLikeSku =
                  /[a-zA-Z]/.test(result.code) && result.code.length < 20
                if (looksLikeSku) {
                  set('sku', result.code)
                } else {
                  set('barcode', result.code)
                  if (!state.sku) set('sku', result.code)
                }
                if (result.suggestion) {
                  const sug = result.suggestion
                  if (sug.name && !state.name) set('name', sug.name)
                  if (sug.brand && !state.brand) set('brand', normalizeBrand(sug.brand))
                  if (sug.colorway && !state.colorway) set('colorway', sug.colorway)
                  if (sug.imageUrl && !state.stockx_image_url)
                    set('stockx_image_url', sug.imageUrl)
                  setLookupSource(result.source ?? null)
                } else {
                  setLookupSource(null)
                }
                if (result.stockxLink) {
                  const link = result.stockxLink
                  setState((s) => ({
                    ...s,
                    stockx_product_id: link.productId,
                    stockx_variant_id: link.variantId,
                    stockx_url: link.stockxUrl,
                    sku: s.sku?.trim() ? s.sku : link.styleId,
                    size_us: s.size_us?.trim() ? s.size_us : link.sizeUS,
                    size_eu: s.size_eu?.trim() ? s.size_eu : link.sizeEU,
                    release_date: s.release_date ?? link.releaseDate,
                    release_price:
                      s.release_price !== null ? s.release_price : link.retailPrice,
                  }))
                  setStockxFilled(true)
                }
              }}
            >
              {t('form.field.scanLabel')}
            </ScanButton>
          </div>
          {state.barcode && (
            <p
              style={{
                marginTop: 6,
                fontSize: 11,
                color: 'var(--color-text-faint)',
                fontFamily: 'monospace',
              }}
            >
              {t('form.field.barcode')} : {state.barcode}
            </p>
          )}
          {lookupSource && (
            <p style={lookupBadgeStyle}>
              {lookupSource === 'stockx'
                ? t('form.scanFilled.stockx')
                : lookupSource === 'upcitemdb'
                  ? t('form.scanFilled.upcitemdb')
                  : t('form.autoFilled')}
            </p>
          )}
        </Field>
      </Section>

      {/* Tailles */}
      <Section title={t('form.section.size')}>
        <Row>
          <Field label="EU">
            <input
              type="text"
              inputMode="decimal"
              value={state.size_eu ?? ''}
              onChange={(e) => set('size_eu', e.target.value)}
              placeholder="43"
              style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
            />
          </Field>
          <Field label="US">
            <input
              type="text"
              inputMode="decimal"
              value={state.size_us ?? ''}
              onChange={(e) => set('size_us', e.target.value)}
              placeholder="9.5"
              style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
            />
          </Field>
        </Row>
      </Section>

      {/* Prix */}
      <Section title={t('form.section.release')}>
        <Row>
          <Field label={t('form.field.releasePrice')}>
            <input
              type="number"
              inputMode="decimal"
              step="1"
              min="0"
              value={state.release_price ?? ''}
              onChange={(e) =>
                set('release_price', e.target.value === '' ? null : Number(e.target.value))
              }
              placeholder="180"
              style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
            />
          </Field>
          <Field label={`${t('detail.price.cote')} (€)`}>
            <input
              type="number"
              inputMode="decimal"
              step="1"
              min="0"
              value={state.market_price ?? ''}
              onChange={(e) =>
                set('market_price', e.target.value === '' ? null : Number(e.target.value))
              }
              placeholder="850"
              style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
            />
          </Field>
        </Row>
        <Field label={t('form.field.releaseDate')}>
          <input
            type="date"
            value={state.release_date ?? ''}
            onChange={(e) => set('release_date', e.target.value || null)}
            style={inputStyle}
          />
        </Field>
      </Section>

      {/* Achat */}
      <Section title={t('form.section.purchase')}>
        <Row>
          <Field label={t('form.field.purchaseDate')}>
            <input
              type="date"
              value={state.purchase_date ?? ''}
              onChange={(e) => set('purchase_date', e.target.value || null)}
              style={inputStyle}
            />
          </Field>
          <Field label={t('form.field.purchasePrice')}>
            <input
              type="number"
              inputMode="decimal"
              step="1"
              min="0"
              value={state.purchase_price ?? ''}
              onChange={(e) =>
                set('purchase_price', e.target.value === '' ? null : Number(e.target.value))
              }
              placeholder="195"
              style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
            />
          </Field>
        </Row>
          </Section>

      {/* Tags + à vendre */}
      <Section title={t('form.section.tracking')}>
        <Field label={t('form.field.tags')}>
          <TagsInput
            value={state.tags}
            onChange={(tags) => set('tags', tags)}
            placeholder={t('form.tagsPlaceholder')}
          />
        </Field>
        <div style={toggleRowStyle}>
          <label style={toggleLabelStyle}>
            <input
              type="checkbox"
              checked={state.is_for_sale}
              onChange={(e) => set('is_for_sale', e.target.checked)}
              style={{ marginRight: 8 }}
            />
            <span style={{ fontSize: 13 }}>{t('form.field.forSale')}</span>
          </label>
          {state.is_for_sale && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                type="number"
                inputMode="decimal"
                step="1"
                min="0"
                value={state.target_sale_price ?? ''}
                onChange={(e) =>
                  set(
                    'target_sale_price',
                    e.target.value === '' ? null : Number(e.target.value),
                  )
                }
                placeholder={t('form.field.targetSalePrice')}
                style={{ ...inputStyle, fontVariantNumeric: 'tabular-nums' }}
              />
            </div>
          )}
        </div>
      </Section>

      {/* Notes */}
      <Section title={t('form.section.notes')}>
        <textarea
          value={state.notes ?? ''}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 70 }}
        />
      </Section>

      {/* Submit */}
      {submitError && <p style={errorBoxStyle}>{submitError}</p>}
      <button
        type="submit"
        disabled={submitting || uploading || !state.name.trim()}
        style={{
          ...submitBtnStyle,
          opacity: submitting || uploading || !state.name.trim() ? 0.55 : 1,
          cursor: submitting || uploading ? 'wait' : 'pointer',
        }}
      >
        {submitting
          ? t('form.submit.saving')
          : (submitLabel ?? (initial ? t('form.submit.update') : t('form.submit.create')))}
      </button>
    </form>
  )
}

/* =====================================================
 * Sous-composants
 * ===================================================== */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset style={sectionStyle}>
      <legend style={legendStyle}>{title}</legend>
      <div style={{ display: 'grid', gap: 14 }}>{children}</div>
    </fieldset>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={rowStyle}>{children}</div>
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={fieldLabelStyle}>
        {label}
        {required && <span style={{ color: 'var(--color-bred)' }}> *</span>}
      </span>
      {children}
    </label>
  )
}

function PhotoField({
  path,
  uploading,
  onPickFile,
  onClear,
}: {
  path: string | null
  uploading: boolean
  onPickFile: () => void
  onClear: () => void
}) {
  const { t } = useT()
  const { data: signedUrl } = useSignedPhotoUrl(path)

  return (
    <div style={photoFieldWrapStyle}>
      <div style={photoPreviewStyle}>
        {signedUrl ? (
          <img
            src={signedUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <PhotoPlaceholder />
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onPickFile}
          disabled={uploading}
          style={photoBtnStyle(false)}
        >
          {uploading
            ? t('form.photo.uploading')
            : path
              ? t('form.photo.change')
              : t('form.photo.upload')}
        </button>
        {path && !uploading && (
          <button type="button" onClick={onClear} style={photoBtnStyle(true)}>
            {t('form.photo.remove')}
          </button>
        )}
      </div>
    </div>
  )
}

/* =====================================================
 * Helpers
 * ===================================================== */

function initialState(
  s: Sneaker | undefined,
  defaults: Partial<SneakerInput> | undefined,
): SneakerInput {
  const base: SneakerInput = {
    name: s?.name ?? '',
    brand: s?.brand ?? null,
    colorway: s?.colorway ?? null,
    sku: s?.sku ?? null,
    stockx_url: s?.stockx_url ?? null,
    stockx_image_url: s?.stockx_image_url ?? null,
    stockx_product_id: s?.stockx_product_id ?? null,
    stockx_variant_id: s?.stockx_variant_id ?? null,
    size_eu: s?.size_eu ?? null,
    size_us: s?.size_us ?? null,
    release_date: s?.release_date ?? null,
    release_price: s?.release_price ?? null,
    market_price: s?.market_price ?? null,
    market_price_usd: s?.market_price_usd ?? null,
    purchase_date: s?.purchase_date ?? null,
    purchase_price: s?.purchase_price ?? null,
    condition: s?.condition ?? 'DS',
    photo_url: s?.photo_url ?? null,
    barcode: s?.barcode ?? null,
    notes: s?.notes ?? null,
    currency: s?.currency ?? 'EUR',
    tags: s?.tags ?? [],
    is_for_sale: s?.is_for_sale ?? false,
    target_sale_price: s?.target_sale_price ?? null,
  }
  // En mode création, on merge les defaults par dessus
  if (!s && defaults) {
    return { ...base, ...defaults }
  }
  return base
}

/**
 * Map a StockX brand string to one of the values supported by our brand
 * <select>. Returns null for unknown brands (the user can pick manually).
 */
function normalizeBrand(stockxBrand: string | null): string | null {
  if (!stockxBrand) return null
  const b = stockxBrand.trim().toLowerCase()
  if (b === 'jordan' || b === 'air jordan') return 'Air Jordan'
  if (b === 'nike') return 'Nike'
  if (b === 'adidas') return 'Adidas'
  if (b === 'new balance') return 'New Balance'
  if (b === 'puma') return 'Puma'
  if (b === 'asics') return 'ASICS'
  if (b === 'yeezy') return 'Yeezy'
  return null
}

/* =====================================================
 * Styles
 * ===================================================== */

const formStyle: CSSProperties = { display: 'grid', gap: 18 }
const sectionStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '16px 14px',
  margin: 0,
}
const legendStyle: CSSProperties = {
  padding: '0 6px',
  fontFamily: 'var(--font-display)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
}
const fieldLabelStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-display)',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  marginBottom: 6,
}
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 14,
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  outline: 'none',
  fontFamily: 'inherit',
}
const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
}
const submitBtnStyle: CSSProperties = {
  width: '100%',
  padding: '14px',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: 'var(--color-bred)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  transition: 'opacity var(--transition-fast)',
}
const errorBoxStyle: CSSProperties = {
  padding: '12px 14px',
  background: 'var(--color-bred-bg)',
  border: '1px solid var(--color-bred)',
  color: 'var(--color-bred)',
  borderRadius: 'var(--radius-md)',
  fontSize: 13,
}
const errorTextStyle: CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  color: 'var(--color-bred)',
}
const photoFieldWrapStyle: CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'center',
  flexWrap: 'wrap',
}
const photoPreviewStyle: CSSProperties = {
  width: 100,
  height: 100,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  position: 'relative',
  overflow: 'hidden',
  flexShrink: 0,
}
const photoBtnStyle = (danger: boolean): CSSProperties => ({
  padding: '8px 14px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 500,
  background: 'var(--color-surface)',
  color: danger ? 'var(--color-bred)' : 'var(--color-text)',
  border: `1px solid ${danger ? 'var(--color-bred)' : 'var(--color-border)'}`,
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-display)',
  cursor: 'pointer',
})

const lookupBadgeStyle: CSSProperties = {
  marginTop: 8,
  fontSize: 11,
  color: 'var(--color-royal)',
  background: 'rgba(29, 66, 138, 0.08)',
  border: '1px solid rgba(29, 66, 138, 0.2)',
  padding: '6px 10px',
  borderRadius: 'var(--radius-md)',
  lineHeight: 1.4,
}

const stockxBadgeStyle: CSSProperties = {
  margin: 0,
  fontSize: 11,
  color: 'var(--color-royal)',
  background: 'rgba(29, 66, 138, 0.08)',
  border: '1px solid rgba(29, 66, 138, 0.2)',
  padding: '8px 10px',
  borderRadius: 'var(--radius-md)',
  lineHeight: 1.4,
}

const toggleRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'center',
  flexWrap: 'wrap',
}

const toggleLabelStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}
