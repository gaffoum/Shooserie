import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRankDisplay } from '@/lib/ranks'
import { useTheme } from '@/contexts/ThemeContext'
import { useT, localeFor } from '@/i18n/I18nContext'
import './WelcomeCelebration.css'

interface WelcomeCelebrationProps {
  starsTotal: number
  rank: string
  pairs: number
  grails: number
  brands: number
  /** Chips de jalons (déjà résolus i18n), 0 à ~5. */
  milestones: string[]
  onClose: () => void
}

const GOLD = ['#f7e392', '#e7c257', '#d8b24a', '#fff3c4', '#f0c948']
const PARTICLES = 22

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Écran de bienvenue post-lancement (célébration one-shot). Overlay + carte
 * holographique dorée : sur-titre, titre, écusson de rang héros (halo + float),
 * nom du rang, total d'étoiles en comptage animé 0→total, ligne de récap, chips
 * de jalons, CTA « Voir ma progression » + « Plus tard ». Sans scroll (390×844).
 */
export function WelcomeCelebration({
  starsTotal,
  rank,
  pairs,
  grails,
  brands,
  milestones,
  onClose,
}: WelcomeCelebrationProps) {
  const { t, lang } = useT()
  const { resolved } = useTheme()
  const navigate = useNavigate()
  const reduced = prefersReducedMotion()
  const disp = getRankDisplay(rank)
  const icon = resolved === 'dark' ? disp.iconDark : disp.iconLight
  const fmt = (n: number) => n.toLocaleString(localeFor(lang))

  // Comptage animé 0 → total (~1.3 s, ease-out). Figé au total si reduced-motion.
  const [count, setCount] = useState(reduced ? starsTotal : 0)
  const particlesRef = useRef(reduced ? [] : buildParticles())

  useEffect(() => {
    if (reduced) return
    const DURATION = 1300
    let raf = 0
    let start = 0
    const tick = (ts: number) => {
      if (!start) start = ts
      const p = Math.min(1, (ts - start) / DURATION)
      const eased = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(eased * starsTotal))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [iconFailed, setIconFailed] = useState(false)

  const goProgression = () => {
    onClose()
    navigate('/progression')
  }

  return (
    <div className="welcome-overlay" role="dialog" aria-modal="true" aria-label={t('welcome.title')}>
      <div className="welcome-card">
        {particlesRef.current.length > 0 && (
          <div className="star-cel-burst" aria-hidden>
            {particlesRef.current.map((p, i) => (
              <span
                key={i}
                className="star-cel-particle"
                style={
                  {
                    '--p-tx': `${p.tx}px`,
                    '--p-ty': `${p.ty}px`,
                    '--p-color': p.color,
                    '--p-dur': `${p.dur}ms`,
                    '--p-delay': `${p.delay}ms`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        )}

        <button type="button" className="welcome-close" aria-label={t('welcome.later')} onClick={onClose}>
          ✕
        </button>

        <div className="welcome-content">
          <div className="lab welcome-eyebrow">{t('welcome.eyebrow')}</div>
          <h1 className="welcome-title">{t('welcome.title')}</h1>

          {/* Écusson héros */}
          <div className="welcome-crest anim-floatY">
            <div className="welcome-crest-halo" aria-hidden />
            {iconFailed ? (
              <span className="welcome-crest-fallback" aria-hidden>🏅</span>
            ) : (
              <img src={icon} alt="" aria-hidden className="welcome-crest-img" onError={() => setIconFailed(true)} />
            )}
          </div>

          <div className="welcome-rank">{disp.label}</div>

          {/* Total d'étoiles animé */}
          <div className="welcome-stars">
            <span aria-hidden>⭐</span> <span className="welcome-stars-num">{fmt(count)}</span>
          </div>

          {/* Récap */}
          <div className="lab welcome-recap">
            {t('welcome.recap', { pairs: fmt(pairs), grails: fmt(grails), brands: fmt(brands) })}
          </div>

          {/* Jalons */}
          {milestones.length > 0 && (
            <div className="welcome-chips">
              {milestones.slice(0, 5).map((m) => (
                <span key={m} className="welcome-chip">{m}</span>
              ))}
            </div>
          )}

          {/* CTA */}
          <button type="button" className="welcome-cta" onClick={goProgression}>
            {t('welcome.cta')}
          </button>
          <button type="button" className="welcome-secondary" onClick={onClose}>
            {t('welcome.later')}
          </button>
        </div>
      </div>
    </div>
  )
}

interface Particle {
  tx: number
  ty: number
  color: string
  dur: number
  delay: number
}
function buildParticles(): Particle[] {
  const out: Particle[] = []
  for (let i = 0; i < PARTICLES; i++) {
    const angle = (i / PARTICLES) * Math.PI * 2 + (Math.random() - 0.5) * 0.4
    const dist = 100 + Math.random() * 130
    out.push({
      tx: Math.round(Math.cos(angle) * dist),
      ty: Math.round(Math.sin(angle) * dist),
      color: GOLD[i % GOLD.length],
      dur: 900 + Math.round(Math.random() * 500),
      delay: Math.round(Math.random() * 200),
    })
  }
  return out
}
