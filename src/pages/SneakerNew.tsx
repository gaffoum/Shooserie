import { useLocation, useNavigate } from 'react-router-dom'
import { AppHeader } from '@/components/AppHeader'
import { SneakerForm } from '@/components/SneakerForm'
import { BackLink } from '@/components/BackLink'
import { useCreateSneaker, type SneakerInput } from '@/lib/queries'
import type { CSSProperties } from 'react'

interface LocationState {
  defaults?: Partial<SneakerInput>
  scannedFrom?: 'dashboard'
  lookupSource?: string | null
}

export function SneakerNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState | null) ?? null
  const defaults = state?.defaults
  const fromScan = state?.scannedFrom === 'dashboard'
  const lookupSource = state?.lookupSource

  const createMutation = useCreateSneaker()

  const handleSubmit = async (input: SneakerInput) => {
    const sneaker = await createMutation.mutateAsync(input)
    navigate(`/sneakers/${sneaker.id}`, { replace: true })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackLink to="/dashboard" />} />
      <main style={mainStyle}>
        <h1 style={titleStyle}>Nouvelle paire</h1>
        <p style={subtitleStyle}>
          {fromScan && lookupSource === 'stockx'
            ? "Code scanné et matché au catalogue — toutes les infos sont liées, y compris la taille. Vérifie avant d'enregistrer."
            : fromScan && lookupSource
              ? `Code scanné et infos pré-remplies depuis ${lookupSource === 'upcitemdb' ? 'UPCitemdb' : lookupSource}. Vérifie avant d'enregistrer.`
              : fromScan
                ? 'Code scanné. Aucune info auto trouvée — complète manuellement.'
                : "Tape le nom du modèle dans la barre de recherche pour tout pré-remplir, ou scanne un code-barre via le bouton du champ SKU."}
        </p>

        <SneakerForm
          defaults={defaults}
          onSubmit={handleSubmit}
          submitting={createMutation.isPending}
          submitLabel="Ajouter à la collection"
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
