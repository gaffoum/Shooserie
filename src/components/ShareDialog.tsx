import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  useMyShareLinks,
  useCreateShareLink,
  useRevokeShareLink,
  useDeleteShareLink,
} from '@/lib/queries'
import { useT } from '@/i18n/I18nContext'

interface ShareDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Manage public share links for the user's collection.
 *
 * The link IS the access — anyone with it can view, no account needed. The
 * UI surfaces this clearly so the user understands the trust model:
 *   • generates 1+ links (each with optional human label)
 *   • copies a link to clipboard
 *   • revokes (soft-delete: the link stops working but stays in history)
 *   • deletes (hard-delete: token is purged)
 *
 * Tokens come from crypto.randomUUID() — 128 bits of entropy, unguessable.
 */
export function ShareDialog({ open, onClose }: ShareDialogProps) {
  const { t } = useT()
  const { data: links, isLoading } = useMyShareLinks()
  const createLink = useCreateShareLink()
  const revokeLink = useRevokeShareLink()
  const deleteLink = useDeleteShareLink()
  const [labelInput, setLabelInput] = useState('')
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Reset transient UI state when the dialog closes (so reopening feels clean).
  useEffect(() => {
    if (!open) {
      setLabelInput('')
      setCopiedToken(null)
    }
  }, [open])

  // Esc to dismiss.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Currently-active links sit at the top; revoked ones below.
  const sorted = useMemo(() => {
    if (!links) return []
    return [...links].sort((a, b) => {
      if (a.is_active === b.is_active) {
        return b.created_at.localeCompare(a.created_at)
      }
      return a.is_active ? -1 : 1
    })
  }, [links])

  if (!open) return null

  const handleCreate = async () => {
    try {
      await createLink.mutateAsync({ label: labelInput.trim() || undefined })
      setLabelInput('')
    } catch {
      // mutation onError handled by react-query; we surface errors below.
    }
  }

  const handleCopy = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedToken(token)
      // Reset the "Copié !" feedback after 2s so a second copy gives feedback again.
      setTimeout(() => setCopiedToken((curr) => (curr === token ? null : curr)), 2000)
    } catch {
      // Some mobile browsers block clipboard outside HTTPS or without user gesture
      // chain. As a fallback, prompt the user to copy manually.
      window.prompt(t('share.copyManual'), url)
    }
  }

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div style={dialogStyle}>
        <header style={headerStyle}>
          <h2 id="share-title" style={titleStyle}>
            {t('share.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.cancel')}
            style={closeBtnStyle}
          >
            ×
          </button>
        </header>

        <p style={descStyle}>{t('share.desc')}</p>

        {/* Create new link */}
        <div style={createWrapStyle}>
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder={t('share.labelPlaceholder')}
            maxLength={50}
            style={inputStyle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate()
            }}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={createLink.isPending}
            style={createBtnStyle(createLink.isPending)}
          >
            {createLink.isPending ? t('share.creating') : t('share.create')}
          </button>
        </div>
        {createLink.isError && (
          <p style={errorStyle}>{(createLink.error as Error).message}</p>
        )}

        {/* Privacy reminder */}
        <p style={privacyStyle}>{t('share.privacy')}</p>

        {/* Existing links */}
        <div style={listWrapStyle}>
          {isLoading ? (
            <p style={emptyStyle}>{t('share.loading')}</p>
          ) : sorted.length === 0 ? (
            <p style={emptyStyle}>{t('share.empty')}</p>
          ) : (
            <ul style={listStyle}>
              {sorted.map((link) => {
                const url = `${window.location.origin}/share/${link.token}`
                const date = new Date(link.created_at).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
                const isCopied = copiedToken === link.token
                return (
                  <li key={link.token} style={linkItemStyle(!link.is_active)}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={linkTopStyle}>
                        <span style={linkLabelStyle}>
                          {link.label || t('share.defaultLabel')}
                        </span>
                        {!link.is_active && (
                          <span style={revokedBadgeStyle}>
                            {t('share.revoked')}
                          </span>
                        )}
                      </div>
                      <div style={linkUrlStyle} title={url}>
                        {url}
                      </div>
                      <div style={linkMetaStyle}>{t('share.createdOn', { date })}</div>
                    </div>
                    <div style={linkActionsStyle}>
                      {link.is_active ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopy(link.token)}
                            style={actionBtnStyle(isCopied)}
                          >
                            {isCopied ? t('share.copied') : t('share.copy')}
                          </button>
                          <button
                            type="button"
                            onClick={() => revokeLink.mutate(link.token)}
                            disabled={revokeLink.isPending}
                            style={actionBtnSecondaryStyle}
                          >
                            {t('share.revoke')}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(t('share.confirmDelete'))) {
                              deleteLink.mutate(link.token)
                            }
                          }}
                          disabled={deleteLink.isPending}
                          style={actionBtnDangerStyle}
                        >
                          {t('share.delete')}
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Styles
// ============================================================================

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(10, 10, 10, 0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  zIndex: 1000,
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)',
}
const dialogStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-xl)',
  padding: '20px 22px 18px',
  width: '100%',
  maxWidth: 520,
  maxHeight: '90vh',
  overflowY: 'auto',
}
const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 6,
}
const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--color-text)',
}
const closeBtnStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  fontSize: 28,
  lineHeight: 1,
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  padding: '0 4px',
}
const descStyle: CSSProperties = {
  margin: '0 0 16px',
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
}
const createWrapStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  marginBottom: 8,
}
const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '10px 12px',
  fontSize: 13,
  background: 'var(--color-bg)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text)',
  outline: 'none',
}
const createBtnStyle = (pending: boolean): CSSProperties => ({
  padding: '10px 14px',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: pending ? 'var(--color-text-muted)' : 'var(--color-bred)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: pending ? 'wait' : 'pointer',
  fontFamily: 'var(--font-display)',
  whiteSpace: 'nowrap',
  flexShrink: 0,
})
const privacyStyle: CSSProperties = {
  margin: '0 0 16px',
  padding: '8px 10px',
  fontSize: 11,
  color: 'var(--color-text-muted)',
  background: 'var(--color-bg)',
  borderRadius: 'var(--radius-sm)',
  lineHeight: 1.5,
}
const listWrapStyle: CSSProperties = {
  borderTop: '1px solid var(--color-border)',
  paddingTop: 14,
}
const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}
const linkItemStyle = (revoked: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  padding: '10px 12px',
  background: revoked ? 'var(--color-bg)' : 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  opacity: revoked ? 0.7 : 1,
})
const linkTopStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 2,
}
const linkLabelStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const revokedBadgeStyle: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 'var(--tracking-wider)',
  textTransform: 'uppercase',
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
  background: 'rgba(220, 38, 38, 0.1)',
  color: 'var(--color-down)',
  fontFamily: 'var(--font-display)',
}
const linkUrlStyle: CSSProperties = {
  fontSize: 11,
  color: 'var(--color-text-muted)',
  fontFamily: 'monospace',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const linkMetaStyle: CSSProperties = {
  fontSize: 10,
  color: 'var(--color-text-faint)',
  marginTop: 2,
}
const linkActionsStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flexShrink: 0,
}
const actionBtnStyle = (highlighted: boolean): CSSProperties => ({
  padding: '6px 10px',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: highlighted ? 'var(--color-up)' : 'var(--color-text)',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  whiteSpace: 'nowrap',
  transition: 'background 0.15s ease',
})
const actionBtnSecondaryStyle: CSSProperties = {
  padding: '6px 10px',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: 'transparent',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  whiteSpace: 'nowrap',
}
const actionBtnDangerStyle: CSSProperties = {
  padding: '6px 10px',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  background: 'transparent',
  color: 'var(--color-down)',
  border: '1px solid var(--color-down)',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  whiteSpace: 'nowrap',
}
const emptyStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: 'var(--color-text-muted)',
  textAlign: 'center',
  padding: '14px 0',
}
const errorStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 12,
  color: 'var(--color-bred)',
}
