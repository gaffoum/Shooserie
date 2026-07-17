import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { useSneakers, PROFILE_KEY, type Profile } from '@/lib/queries'
import { useT } from '@/i18n/I18nContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getRankDisplay, getRankIndex } from '@/lib/ranks'
import {
  fetchStarEventsSince,
  fetchLatestStarEventAt,
  fetchProfileStars,
  isToastable,
  getRuleLabelKey,
} from '@/lib/stars'
import { StarToast, type ToastItem } from './StarToast'
import '@/styles/star-toasts.css'

/** Nb max de toasts affichés simultanément (le reste attend en file). */
const MAX_VISIBLE = 3
/** Au-delà, on regroupe les gains en un seul toast (anti-spam). */
const GROUP_THRESHOLD = 3
const DURATION_GAIN = 3200
const DURATION_RANK = 4200

function cursorStorageKey(uid: string) {
  return `shooserie:stars:cursor:${uid}`
}
function readCursor(uid: string): string | null {
  try {
    return window.localStorage.getItem(cursorStorageKey(uid))
  } catch {
    return null
  }
}
function writeCursor(uid: string, iso: string) {
  try {
    window.localStorage.setItem(cursorStorageKey(uid), iso)
  } catch {
    // localStorage indisponible (mode privé) : on continue sans persistance.
  }
}

/**
 * Provider global des toasts d'étoiles. Monté sous AuthProvider.
 *
 * Rôle :
 *  1. Surveille le cache des sneakers (invalidé après ajout/màj de paire) ;
 *     à chaque changement, lit les `star_events` nouveaux (curseur persistant)
 *     et affiche un toast par gain éligible — jamais pour la routine.
 *  2. Détecte une montée de rang (comparaison d'index) → toast spécial écusson.
 *  3. Rafraîchit le profil (badge + barre de progression) après chaque gain.
 *
 * Anti-re-notification : curseur `created_at` persistant en localStorage.
 * Anti-spam : file plafonnée + regroupement au-delà de GROUP_THRESHOLD.
 */
export function StarToastProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const { t, lang } = useT()
  const { resolved } = useTheme()
  const sneakers = useSneakers()

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const pendingRef = useRef<ToastItem[]>([])
  const counterRef = useRef(0)

  const cursorRef = useRef<string | null>(null)
  const prevRankRef = useRef<string>('rookie')
  const [baselineReady, setBaselineReady] = useState(false)
  const lastSeenUpdatedAt = useRef(0)
  const runningRef = useRef(false)

  const fmt = useCallback(
    (n: number) => n.toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US'),
    [lang],
  )

  /* ---- File d'affichage (plafond + overflow en attente) ---- */
  const pump = useCallback(() => {
    setToasts((prev) => {
      const next = [...prev]
      while (next.length < MAX_VISIBLE && pendingRef.current.length > 0) {
        next.push(pendingRef.current.shift()!)
      }
      return next
    })
  }, [])

  const remove = useCallback(
    (id: number) => {
      setToasts((prev) => prev.filter((tItem) => tItem.id !== id))
      pump()
    },
    [pump],
  )

  const enqueue = useCallback(
    (items: ToastItem[]) => {
      if (items.length === 0) return
      pendingRef.current.push(...items)
      pump()
    },
    [pump],
  )

  /* ---- Baseline : curseur + rang de référence, à la connexion ---- */
  useEffect(() => {
    const uid = user?.id
    setBaselineReady(false)
    lastSeenUpdatedAt.current = 0
    if (!uid) {
      cursorRef.current = null
      return
    }
    let cancelled = false
    ;(async () => {
      const stored = readCursor(uid)
      if (stored) {
        cursorRef.current = stored
      } else {
        // Premier usage : caler le curseur sur le dernier event existant pour
        // ne PAS rejouer l'historique en toasts.
        const latest = await fetchLatestStarEventAt(uid)
        const iso = latest ?? new Date(0).toISOString()
        cursorRef.current = iso
        writeCursor(uid, iso)
      }
      const prof = await fetchProfileStars(uid)
      prevRankRef.current = prof?.rank ?? 'rookie'
      if (!cancelled) setBaselineReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  /* ---- Vérification à chaque changement du cache sneakers ---- */
  const runCheck = useCallback(async () => {
    const uid = user?.id
    if (!uid || cursorRef.current === null || runningRef.current) return
    runningRef.current = true
    try {
      const events = await fetchStarEventsSince(uid, cursorRef.current)
      // Rafraîchit le profil → badge + barre de progression à jour.
      await qc.invalidateQueries({ queryKey: PROFILE_KEY })
      if (events.length === 0) return

      // Avance le curseur (tous events, y compris silencieux) et persiste.
      const maxCreated = events[events.length - 1].created_at
      cursorRef.current = maxCreated
      writeCursor(uid, maxCreated)

      const gains = events.filter((e) => isToastable(e.rule_key))
      const items: ToastItem[] = []

      if (gains.length > GROUP_THRESHOLD) {
        const pts = gains.reduce((s, e) => s + e.points, 0)
        items.push({
          id: ++counterRef.current,
          kind: 'group',
          label: t('stars.toast.group', { n: gains.length }),
          pointsText: t('stars.toast.points', { n: fmt(pts) }),
        })
      } else {
        for (const e of gains) {
          items.push({
            id: ++counterRef.current,
            kind: 'gain',
            label: t(getRuleLabelKey(e.rule_key)),
            pointsText: t('stars.toast.points', { n: fmt(e.points) }),
          })
        }
      }

      // Montée de rang : toast prioritaire (climax), ajouté en dernier.
      const fresh = qc.getQueryData<Profile | null>(PROFILE_KEY)
      const newRank = fresh?.rank ?? (await fetchProfileStars(uid))?.rank ?? prevRankRef.current
      if (getRankIndex(newRank) > getRankIndex(prevRankRef.current)) {
        const disp = getRankDisplay(newRank)
        items.push({
          id: ++counterRef.current,
          kind: 'rank',
          label: disp.label,
          rankTitle: t('stars.toast.rankTitle'),
          iconSrc: resolved === 'dark' ? disp.iconDark : disp.iconLight,
        })
      }
      prevRankRef.current = newRank

      enqueue(items)
    } catch {
      // Lecture best-effort : un échec ne doit jamais casser l'app.
    } finally {
      runningRef.current = false
    }
  }, [user?.id, qc, t, fmt, resolved, enqueue])

  useEffect(() => {
    if (!baselineReady) return
    // Premier passage après baseline : on mémorise l'état courant sans notifier.
    if (lastSeenUpdatedAt.current === 0) {
      lastSeenUpdatedAt.current = sneakers.dataUpdatedAt || 1
      return
    }
    if (sneakers.dataUpdatedAt === lastSeenUpdatedAt.current) return
    lastSeenUpdatedAt.current = sneakers.dataUpdatedAt
    void runCheck()
  }, [baselineReady, sneakers.dataUpdatedAt, runCheck])

  return (
    <>
      {children}
      <div className="star-toasts" aria-live="polite" aria-atomic="false">
        {toasts.map((item) => (
          <StarToast
            key={item.id}
            item={item}
            duration={item.kind === 'rank' ? DURATION_RANK : DURATION_GAIN}
            onDone={remove}
          />
        ))}
      </div>
    </>
  )
}
