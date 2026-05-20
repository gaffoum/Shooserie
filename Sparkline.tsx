import { useEffect } from 'react'
import { useT } from '@/i18n/I18nContext'
import type { CSSProperties } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  pending?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive,
  pending,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useT()
  const finalConfirm = confirmLabel ?? t('common.confirm')
  const finalCancel = cancelLabel ?? t('common.cancel')

  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onCancel()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [open, pending, onCancel])

  if (!open) return null

  return (
    <div
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel()
      }}
    >
      <div style={dialogStyle}>
        <h2 id="confirm-title" style={titleStyle}>{title}</h2>
        {description && <p style={descStyle}>{description}</p>}
        <div style={actionsStyle}>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            style={cancelBtnStyle}
          >
            {finalCancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            style={{
              ...confirmBtnStyle,
              background: destructive ? 'var(--color-bred)' : 'var(--color-text)',
              color: '#FFFFFF',
              opacity: pending ? 0.6 : 1,
            }}
          >
            {pending ? `${finalConfirm}…` : finalConfirm}
          </button>
        </div>
      </div>
    </div>
  )
}

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
  padding: '22px 22px 18px',
  maxWidth: 360,
  width: '100%',
}
const titleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 17,
  fontWeight: 600,
  marginBottom: 8,
  color: 'var(--color-text)',
}
const descStyle: CSSProperties = {
  fontSize: 13,
  color: 'var(--color-text-muted)',
  lineHeight: 1.5,
  marginBottom: 22,
}
const actionsStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
}
const cancelBtnStyle: CSSProperties = {
  padding: '9px 16px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 500,
  background: 'transparent',
  color: 'var(--color-text-muted)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
}
const confirmBtnStyle: CSSProperties = {
  padding: '9px 16px',
  fontSize: 11,
  letterSpacing: 'var(--tracking-wide)',
  textTransform: 'uppercase',
  fontWeight: 600,
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
}
