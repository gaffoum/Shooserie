import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useT } from '@/i18n/I18nContext'
import './Landing.css'

/**
 * Landing publique (handoff Niveau 2 « Splash / Manifesto »).
 * Affichée sur `/` quand l'utilisateur n'est pas connecté (sinon → /dashboard).
 * Ambiance dark : fonds radiaux Bred + Royal, titre manifeste, sneaker héros
 * flottante (slot à remplir), halo rouge pulsé, CTA vers connexion.
 */
export function Landing() {
  const { t } = useT()
  const [heroFailed, setHeroFailed] = useState(false)

  return (
    <div className="landing">
      <div className="landing__bg" aria-hidden />
      <div className="landing__watermark" aria-hidden>SH</div>

      <div className="landing__inner">
        {/* Logo */}
        <div className="landing__brand">
          <svg width="34" height="34" viewBox="0 0 160 160" aria-hidden>
            <rect width="160" height="160" rx="36" fill="#111" />
            <rect x="28.3" y="45" width="103.4" height="19.22" rx="5.6" fill="#F2F2F2" />
            <rect x="33" y="56.22" width="94" height="54.78" rx="8" fill="#FFFFFF" />
            <rect x="50.7" y="67.22" width="2.8" height="26" fill="#0A0A0A" />
            <rect x="55.5" y="67.22" width="5.6" height="26" fill="#CE1141" />
            <rect x="63.1" y="67.22" width="2.8" height="26" fill="#0A0A0A" />
            <rect x="67.9" y="67.22" width="7" height="26" fill="#0A0A0A" />
            <rect x="76.9" y="67.22" width="2.8" height="26" fill="#0A0A0A" />
            <rect x="81.7" y="67.22" width="4.2" height="26" fill="#0A0A0A" />
            <rect x="87.9" y="67.22" width="2.8" height="26" fill="#0A0A0A" />
            <rect x="92.7" y="67.22" width="5.6" height="26" fill="#CE1141" />
          </svg>
          <span className="lab landing__brand-name">SHOOSERIE</span>
        </div>

        {/* Sneaker héros — slot à remplir (image produit détourée). */}
        <div className="landing__hero">
          <div className="landing__halo anim-ringPulse" aria-hidden />
          <div className="landing__shoe anim-floatY">
            {heroFailed ? (
              <svg viewBox="0 0 100 60" width="200" height="120" fill="none" aria-hidden
                   stroke="rgba(255,255,255,0.5)" strokeWidth="2.2"
                   strokeLinecap="round" strokeLinejoin="round">
                <path d="M8,42 Q8,22 28,18 L48,16 Q58,16 64,20 L78,30 Q90,35 92,42 L92,48 Q92,52 88,52 L12,52 Q8,52 8,48 Z"
                      fill="rgba(255,255,255,0.08)" stroke="none" />
                <path d="M8,42 Q8,22 28,18 L48,16 Q58,16 64,20 L78,30 Q90,35 92,42 L92,48 Q92,52 88,52 L12,52 Q8,52 8,48 Z" />
                <path d="M30,30 Q42,24 56,26" />
              </svg>
            ) : (
              <img
                src="/hero/jordan1-bred.png"
                alt="Air Jordan 1 Bred"
                className="landing__shoe-img"
                onError={() => setHeroFailed(true)}
              />
            )}
          </div>
        </div>

        {/* Manifeste */}
        <div className="landing__copy">
          <h1 className="landing__title">
            {t('landing.title1')}<br />
            {t('landing.title2')} <span className="landing__title-accent">{t('landing.title3')}</span>
          </h1>
          <p className="landing__subtitle">{t('landing.manifesto')}</p>
        </div>

        {/* CTAs */}
        <div className="landing__cta">
          <Link to="/login" className="landing__btn-primary">
            {t('landing.cta')} <span aria-hidden>→</span>
          </Link>
          <Link to="/login" className="landing__btn-secondary">
            {t('landing.login')}
          </Link>
        </div>
      </div>
    </div>
  )
}
