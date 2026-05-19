import { useNavigate, useParams } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
import { SneakerForm } from '@/components/SneakerForm'
import { useSneaker, useUpdateSneaker, type SneakerInput } from '@/lib/queries'
import { useT } from '@/i18n/I18nContext'
import type { CSSProperties } from 'react'

export function SneakerEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useT()
  const { data: sneaker, isLoading, error } = useSneaker(id)
  const updateMutation = useUpdateSneaker()

  const handleSubmit = async (input: SneakerInput) => {
    if (!id) return
    await updateMutation.mutateAsync({ id, patch: input })
    navigate(`/sneakers/${id}`, { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackLink to={`/sneakers/${id}`} />} />
      <main style={mainStyle}>
        {isLoading && <p style={loadingStyle}>{t('common.loading')}</p>}
        {error && (
          <div style={errorBoxStyle}>
            {t('common.error')} : {(error as Error).message}
          </div>
        )}
        {sneaker && (
          <>
            <h1 style={titleStyle}>{t('edit.title')}</h1>
            <p style={subtitleStyle}>{sneaker.name}</p>
            <SneakerForm
              initial={sneaker}
              onSubmit={handleSubmit}
              submitting={updateMutation.isPending}
            />
          </>
        )}
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
}
const loadingStyle: CSSProperties = {
  textAlign: 'center',
  color: 'var(--color-text-muted)',
  fontSize: 13,
  padding: '40px 20px',
}
const errorBoxStyle: CSSProperties = {
  background: 'var(--color-bred-bg)',
  border: '1px solid var(--color-bred)',
  color: 'var(--color-bred)',
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  fontSize: 13,
}
