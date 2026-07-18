/**
 * Parrainage (/parrainage) — vue « soi » (Vague 2 LOT 2.3).
 * Affiche MON code de parrainage + un lien partageable + mes compteurs de
 * filleuls (inscrits / activés). 🔒 Uniquement mes propres données (RLS
 * referrals : referrer_id = moi). Le branchement du ?ref= au signup est
 * Phase 3B — ici, l'écran.
 */
import { useState, type CSSProperties } from 'react'
import { AppHeader } from '@/components/AppHeader'
import { BackLink } from '@/components/BackLink'
import { useMyProfile, useMyReferral } from '@/lib/queries'
import { useT, localeFor } from '@/i18n/I18nContext'

export default function Referral() {
  const { t, lang } = useT()
  const { data: profile } = useMyProfile()
  const { data: ref } = useMyReferral()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const code = profile?.referral_code ?? null
  const link = code ? `${window.location.origin}/?ref=${code}` : null
  const fmt = (n: number) => n.toLocaleString(localeFor(lang))

  const copy = async (value: string, which: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(which)
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 2000)
    } catch {
      window.prompt(t('referral.copyManual'), value)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <AppHeader leftActions={<BackLink to="/account" />} />
      <main style={mainStyle}>
        <div className="lab" style={eyebrowStyle}>PROFIL</div>
        <h1 style={titleStyle}>{t('referral.title')}</h1>
        <p style={descStyle}>{t('referral.desc')}</p>

        {/* Mon code */}
        <div style={cardStyle}>
          <div className="lab" style={cardLabelStyle}>{t('referral.myCode')}</div>
          {code ? (
            <>
              <div style={codeStyle}>{code}</div>
              <div style={btnRowStyle}>
                <button type="button" style={primaryBtnStyle} onClick={() => copy(code, 'code')}>
                  {copied === 'code' ? t('referral.copied') : t('referral.copyCode')}
                </button>
                {link && (
                  <button type="button" style={secondaryBtnStyle} onClick={() => copy(link, 'link')}>
                    {copied === 'link' ? t('referral.copied') : t('referral.copyLink')}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div style={mutedStyle}>{t('referral.noCode')}</div>
          )}
        </div>

        {/* Compteurs filleuls */}
        <div style={statsStyle}>
          <div style={statCardStyle}>
            <div style={statValueStyle}>{fmt(ref?.signedUp ?? 0)}</div>
            <div className="lab" style={statLabelStyle}>{t('referral.signedUp')}</div>
          </div>
          <div style={statCardStyle}>
            <div style={{ ...statValueStyle, color: 'var(--color-success)' }}>{fmt(ref?.activated ?? 0)}</div>
            <div className="lab" style={statLabelStyle}>{t('referral.activated')}</div>
          </div>
        </div>
      </main>
    </div>
  )
}

const mainStyle: CSSProperties = {
  maxWidth: 480,
  margin: '0 auto',
  padding: '24px 16px',
  fontFamily: 'var(--font-display)',
  color: 'var(--color-text)',
}
const eyebrowStyle: CSSProperties = { color: 'var(--color-bred)', fontSize: 10, letterSpacing: '2px' }
const titleStyle: CSSProperties = { fontSize: 28, fontWeight: 900, letterSpacing: '-0.8px', margin: '2px 0 0' }
const descStyle: CSSProperties = { fontSize: 14, color: 'var(--color-text-muted)', margin: '8px 0 20px', lineHeight: 1.5 }

const cardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: 20,
  textAlign: 'center',
  marginBottom: 14,
}
const cardLabelStyle: CSSProperties = { fontSize: 10, letterSpacing: '1.5px', color: 'var(--color-text-muted)' }
const codeStyle: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 30,
  fontWeight: 700,
  letterSpacing: '3px',
  color: 'var(--color-bred)',
  margin: '10px 0 16px',
}
const btnRowStyle: CSSProperties = { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }
const primaryBtnStyle: CSSProperties = {
  padding: '10px 16px',
  background: 'var(--color-bred)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-btn)',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
}
const secondaryBtnStyle: CSSProperties = {
  padding: '10px 16px',
  background: 'transparent',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-btn)',
  fontWeight: 600,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
}
const mutedStyle: CSSProperties = { fontSize: 14, color: 'var(--color-text-muted)', marginTop: 10 }

const statsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
const statCardStyle: CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '18px 14px',
  textAlign: 'center',
}
const statValueStyle: CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  letterSpacing: '-1px',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-text)',
}
const statLabelStyle: CSSProperties = { fontSize: 9, letterSpacing: '1.5px', color: 'var(--color-text-muted)', marginTop: 6 }
