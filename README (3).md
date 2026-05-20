import { useLocation, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { SneakerForm } from '@/components/SneakerForm'
import { BackLink } from '@/components/BackLink'
import { useCreateSneaker, type SneakerInput } from '@/lib/queries'
import { useT } from '@/i18n/I18nContext'
import type { CSSProperties } from 'react'

interface LocationState {
  defaults?: Partial<SneakerInput>
  scannedFrom?: 'dashboard'
  lookupSource?: string | null
}

export function SneakerNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useT()
  const state = (location.state as LocationState | null) ?? null
  const defaults = state?.defaults
  const fromScan = state?.scannedFrom === 'dashboard'
  const lookupSource = state?.lookupSource

  const createMutation = useCreateSneaker()

  const handleSubmit = async (input: SneakerInput) => {
    const sneaker = await createMutation.mutateAsync(input)
    navigate(`/sneakers/${sneaker.id}`, { replace: true })
  }

  const subtitle = (() => {
    if (fromScan && lookupSource === 'stockx') return t('new.subtitleStockx')
    if (fromScan && lookupSource === 'upcitemdb') return t('new.subtitleUpcitemdb')
    if (fromScan) return t('new.subtitleScannedNoMatch')
    return t('new.subtitleDefault')
  })()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackLink to="/dashboard" />} />
      <main style={mainStyle}>
        <h1 style={titleStyle}>{t('new.title')}</h1>
        <p style={subtitleStyle}>{subtitle}</p>

        <SneakerForm
          defaults={defaults}
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
        />
      </main>
    </div>
  )
}

const mainStyle: CSSProperties = {
  padding: '20px',
  maxWidth: 640,
  margin: '0 auto',
}
const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 22,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  marginBottom: 4,
}
const subtitleStyle: CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: 13,
  marginBottom: 22,
  lineHeight: 1.4,
}
