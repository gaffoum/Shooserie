# ============================================================
#  Shooserie - Admin Health (/admin/health)
#  - src/lib/admin.ts            : constants + isAdmin helper
#  - src/lib/adminQueries.ts     : hook useUserHealth (RPC)
#  - src/components/AdminGuard.tsx : redirect si non-admin
#  - src/pages/AdminHealth.tsx   : page admin
#  - patch App.tsx : route /admin/health
# ============================================================

$ErrorActionPreference = "Stop"

function Write-FileUtf8NoBom {
    param([string]$Path, [string]$Content)
    $dir = Split-Path $Path -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    [System.IO.File]::WriteAllText((Join-Path (Get-Location).Path $Path), $Content, (New-Object System.Text.UTF8Encoding $false))
}
function Read-FileUtf8 {
    param([string]$Path)
    [System.IO.File]::ReadAllText((Join-Path (Get-Location).Path $Path), [System.Text.Encoding]::UTF8)
}

Write-Host ""
Write-Host "=== Script 1/3 : Admin Health ===" -ForegroundColor Cyan

# ============================================================
# 1. src/lib/admin.ts
# ============================================================
$adminTs = @'
/**
 * Whitelist des UIDs admin pour les routes /admin/*.
 *
 * En cas d'ajout d'un admin :
 *  - Ajouter son UID dans ADMIN_USER_IDS ci-dessous
 *  - Mettre a jour la fonction SQL get_user_health_admin (whitelist hardcodee)
 */
export const ADMIN_USER_IDS: ReadonlyArray<string> = [
  'f5f4725b-497b-4dcb-8232-f3167ed1e896', // Layon (Gill)
]

export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false
  return ADMIN_USER_IDS.includes(userId)
}
'@
Write-FileUtf8NoBom -Path "src/lib/admin.ts" -Content $adminTs
Write-Host "  +  src/lib/admin.ts" -ForegroundColor Green

# ============================================================
# 2. src/lib/adminQueries.ts
# ============================================================
$adminQueriesTs = @'
/**
 * Queries reservees admin (RPC SECURITY DEFINER cote DB).
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from './supabase'

export type HealthStatus =
  | 'NEW'
  | 'AT_RISK'
  | 'ENGAGED'
  | 'ACTIVE'
  | 'DORMANT'
  | 'CHURNED'

export interface UserHealthRow {
  id: string
  username: string | null
  display_name: string | null
  signup_at: string
  last_add_at: string | null
  last_wear_at: string | null
  last_action_at: string
  nb_paires: number
  nb_paires_portees: number
  nb_paires_en_vente: number
  days_since_signup: number
  days_since_last_action: number
  health_status: HealthStatus
}

export function useUserHealth() {
  return useQuery({
    queryKey: ['admin-user-health'],
    queryFn: async (): Promise<UserHealthRow[]> => {
      const { data, error } = await supabase.rpc('get_user_health_admin')
      if (error) throw error
      return (data ?? []) as UserHealthRow[]
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}
'@
Write-FileUtf8NoBom -Path "src/lib/adminQueries.ts" -Content $adminQueriesTs
Write-Host "  +  src/lib/adminQueries.ts" -ForegroundColor Green

# ============================================================
# 3. src/components/AdminGuard.tsx
# ============================================================
$adminGuardTsx = @'
/**
 * AdminGuard — protege les routes /admin/*.
 * Si user non-admin, redirige vers /dashboard.
 */
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isAdmin } from '@/lib/admin'

interface AdminGuardProps {
  children: React.ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>
        Chargement…
      </div>
    )
  }

  if (!user || !isAdmin(user.id)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
'@
Write-FileUtf8NoBom -Path "src/components/AdminGuard.tsx" -Content $adminGuardTsx
Write-Host "  +  src/components/AdminGuard.tsx" -ForegroundColor Green

# ============================================================
# 4. src/pages/AdminHealth.tsx
# ============================================================
$adminHealthTsx = @'
/**
 * AdminHealth — dashboard de sante utilisateurs.
 * Reserve aux admins. Affiche :
 *  - Stats globales (NEW, AT_RISK, ENGAGED, ACTIVE, DORMANT, CHURNED)
 *  - Timeline inscriptions par jour
 *  - Table des CHURNED + AT_RISK pour relance manuelle
 */
import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { BackButton } from '../components/BackButton'
import { useUserHealth, type HealthStatus, type UserHealthRow } from '../lib/adminQueries'

const STATUS_META: Record<HealthStatus, { label: string; color: string; bg: string; description: string }> = {
  NEW:      { label: 'NEW',      color: '#0369A1', bg: '#DBEAFE', description: '< 3j, 0 paire — laisse-leur du temps' },
  AT_RISK:  { label: 'AT RISK',  color: '#92400E', bg: '#FEF3C7', description: '3-7j, 0 paire — relance possible' },
  ENGAGED:  { label: 'ENGAGED',  color: '#065F46', bg: '#D1FAE5', description: 'Activés, action < 7j' },
  ACTIVE:   { label: 'ACTIVE',   color: '#1E40AF', bg: '#DBEAFE', description: 'Activés, action 7-30j' },
  DORMANT:  { label: 'DORMANT',  color: '#9F1239', bg: '#FCE7F3', description: 'Activés, inactivité 30-90j' },
  CHURNED:  { label: 'CHURNED',  color: '#991B1B', bg: '#FEE2E2', description: '0 paire ET > 7j — probablement perdus' },
}

const STATUS_ORDER: HealthStatus[] = ['NEW', 'AT_RISK', 'ENGAGED', 'ACTIVE', 'DORMANT', 'CHURNED']

type TabKey = 'overview' | 'at-risk' | 'churned'

export default function AdminHealth() {
  const healthQ = useUserHealth()
  const [tab, setTab] = useState<TabKey>('overview')

  const stats = useMemo(() => {
    const rows = healthQ.data ?? []
    const total = rows.length
    const byStatus: Record<HealthStatus, number> = {
      NEW: 0, AT_RISK: 0, ENGAGED: 0, ACTIVE: 0, DORMANT: 0, CHURNED: 0,
    }
    for (const r of rows) byStatus[r.health_status]++

    const activated = rows.filter(r => r.nb_paires > 0).length
    const churnedActivation = total > 0 ? Math.round(100 * (total - activated) / total) : 0
    const totalPairs = rows.reduce((s, r) => s + r.nb_paires, 0)
    const avgPairs = activated > 0 ? Math.round(totalPairs / activated) : 0

    return { total, activated, churnedActivation, totalPairs, avgPairs, byStatus }
  }, [healthQ.data])

  const signupsByDay = useMemo(() => {
    const rows = healthQ.data ?? []
    const map = new Map<string, number>()
    for (const r of rows) {
      const day = r.signup_at.slice(0, 10) // YYYY-MM-DD
      map.set(day, (map.get(day) ?? 0) + 1)
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [healthQ.data])

  const atRiskUsers = useMemo(() => {
    return (healthQ.data ?? []).filter(r => r.health_status === 'AT_RISK')
      .sort((a, b) => b.days_since_signup - a.days_since_signup)
  }, [healthQ.data])

  const churnedUsers = useMemo(() => {
    return (healthQ.data ?? []).filter(r => r.health_status === 'CHURNED')
      .sort((a, b) => b.days_since_signup - a.days_since_signup)
  }, [healthQ.data])

  if (healthQ.isLoading) {
    return (
      <>
        <AppHeader leftActions={<BackButton />} />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Health</h1>
          <p style={mutedStyle}>Chargement…</p>
        </div>
      </>
    )
  }

  if (healthQ.isError) {
    return (
      <>
        <AppHeader leftActions={<BackButton />} />
        <div style={pageStyle}>
          <h1 style={titleStyle}>Health — Erreur</h1>
          <p style={errorStyle}>{(healthQ.error as Error)?.message ?? 'Erreur inconnue'}</p>
        </div>
      </>
    )
  }

  return (
    <>
      <AppHeader leftActions={<BackButton />} />
      <div style={pageStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>USER HEALTH</h1>
          <p style={subtitleStyle}>
            {stats.total} inscrits · {stats.activated} activés · churn d'activation :{' '}
            <strong style={{ color: stats.churnedActivation > 40 ? '#CE1141' : '#0A0A0A' }}>
              {stats.churnedActivation}%
            </strong>
          </p>
        </header>

        {/* Tabs */}
        <div style={tabsStyle}>
          {(['overview', 'at-risk', 'churned'] as TabKey[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={tab === t ? activeTabStyle : inactiveTabStyle}
            >
              {t === 'overview' ? 'Overview' : t === 'at-risk' ? `At Risk (${atRiskUsers.length})` : `Churned (${churnedUsers.length})`}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            {/* Cards stats */}
            <div style={cardsGridStyle}>
              {STATUS_ORDER.map(s => {
                const meta = STATUS_META[s]
                const count = stats.byStatus[s]
                const pct = stats.total > 0 ? Math.round(100 * count / stats.total) : 0
                return (
                  <div key={s} style={cardStyle}>
                    <div style={{ ...statusPillStyle, color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </div>
                    <div style={cardCountStyle}>{count}</div>
                    <div style={cardPctStyle}>{pct}%</div>
                    <div style={cardDescStyle}>{meta.description}</div>
                  </div>
                )
              })}
            </div>

            {/* Mini timeline inscriptions */}
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>INSCRIPTIONS PAR JOUR</h2>
              <div style={timelineStyle}>
                {signupsByDay.length === 0 && (
                  <p style={mutedStyle}>Aucune donnée</p>
                )}
                {signupsByDay.map(([day, count]) => {
                  const max = Math.max(...signupsByDay.map(([, c]) => c))
                  const width = max > 0 ? Math.max(2, (count / max) * 100) : 0
                  return (
                    <div key={day} style={timelineRowStyle}>
                      <span style={timelineDayStyle}>{day}</span>
                      <div style={timelineBarTrackStyle}>
                        <div style={{ ...timelineBarFillStyle, width: `${width}%` }} />
                      </div>
                      <span style={timelineCountStyle}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* KPIs additionnels */}
            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>KPIs</h2>
              <div style={kpiGridStyle}>
                <Kpi label="Total paires" value={stats.totalPairs.toString()} />
                <Kpi label="Moy. paires / user activé" value={stats.avgPairs.toString()} />
                <Kpi label="Taux d'activation" value={`${100 - stats.churnedActivation}%`} />
              </div>
            </section>
          </>
        )}

        {tab === 'at-risk' && <UserTable rows={atRiskUsers} emptyMsg="Aucun user AT_RISK 🎉" />}
        {tab === 'churned' && <UserTable rows={churnedUsers} emptyMsg="Aucun user CHURNED 🎉" />}
      </div>
    </>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div style={kpiCardStyle}>
      <div style={kpiValueStyle}>{value}</div>
      <div style={kpiLabelStyle}>{label}</div>
    </div>
  )
}

function UserTable({ rows, emptyMsg }: { rows: UserHealthRow[]; emptyMsg: string }) {
  if (rows.length === 0) {
    return <p style={{ ...mutedStyle, padding: 40, textAlign: 'center' }}>{emptyMsg}</p>
  }

  return (
    <div style={tableWrapStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Nom / Pseudo</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Inscrit il y a</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Paires</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>Dernière action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} style={trStyle}>
              <td style={tdStyle}>
                <span style={{ fontWeight: 600 }}>
                  {r.display_name || r.username || 'Anonyme'}
                </span>
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>
                {r.days_since_signup}j
              </td>
              <td style={{ ...tdStyle, textAlign: 'right' }}>
                {r.nb_paires}
              </td>
              <td style={{ ...tdStyle, textAlign: 'right', color: '#6B7280' }}>
                {r.nb_paires === 0 ? '—' : `il y a ${r.days_since_last_action}j`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// =================================================================
// Styles
// =================================================================
const pageStyle: CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '24px 16px 80px',
  fontFamily: "'Outfit', sans-serif",
}
const headerStyle: CSSProperties = { marginBottom: 24 }
const titleStyle: CSSProperties = {
  fontSize: 40, fontWeight: 900, letterSpacing: '-0.02em',
  color: '#0A0A0A', margin: 0, lineHeight: 1.05,
}
const subtitleStyle: CSSProperties = {
  fontSize: 14, color: '#6B7280', marginTop: 8,
}
const mutedStyle: CSSProperties = { color: '#6B7280', fontSize: 13 }
const errorStyle: CSSProperties = { color: '#CE1141', fontSize: 13 }

const tabsStyle: CSSProperties = {
  display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #E5E7EB',
}
const activeTabStyle: CSSProperties = {
  padding: '8px 14px', border: 'none', background: 'transparent',
  borderBottom: '2px solid #CE1141', color: '#0A0A0A', fontWeight: 700,
  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
}
const inactiveTabStyle: CSSProperties = {
  padding: '8px 14px', border: 'none', background: 'transparent',
  color: '#6B7280', fontWeight: 500, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
}

const cardsGridStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 12, marginBottom: 24,
}
const cardStyle: CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 10, padding: 14,
}
const statusPillStyle: CSSProperties = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 999,
  fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
}
const cardCountStyle: CSSProperties = {
  fontSize: 32, fontWeight: 800, color: '#0A0A0A', marginTop: 8, lineHeight: 1,
  fontVariantNumeric: 'tabular-nums',
}
const cardPctStyle: CSSProperties = {
  fontSize: 12, color: '#6B7280', marginTop: 2,
}
const cardDescStyle: CSSProperties = {
  fontSize: 11, color: '#9CA3AF', marginTop: 8, lineHeight: 1.4,
}

const sectionStyle: CSSProperties = { marginBottom: 32 }
const sectionTitleStyle: CSSProperties = {
  fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#0A0A0A', margin: '0 0 12px',
}

const timelineStyle: CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 10, padding: 16,
}
const timelineRowStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: '110px 1fr 50px',
  alignItems: 'center', gap: 12, padding: '4px 0',
}
const timelineDayStyle: CSSProperties = {
  fontSize: 11, color: '#6B7280', fontVariantNumeric: 'tabular-nums',
}
const timelineBarTrackStyle: CSSProperties = {
  height: 8, background: '#F3F4F6', borderRadius: 999,
}
const timelineBarFillStyle: CSSProperties = {
  height: '100%', background: '#CE1141', borderRadius: 999,
}
const timelineCountStyle: CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#0A0A0A',
  fontVariantNumeric: 'tabular-nums', textAlign: 'right',
}

const kpiGridStyle: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12,
}
const kpiCardStyle: CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 10, padding: 16, textAlign: 'center',
}
const kpiValueStyle: CSSProperties = {
  fontSize: 28, fontWeight: 800, color: '#0A0A0A', fontVariantNumeric: 'tabular-nums',
}
const kpiLabelStyle: CSSProperties = {
  fontSize: 11, color: '#6B7280', marginTop: 4,
  textTransform: 'uppercase', letterSpacing: '0.04em',
}

const tableWrapStyle: CSSProperties = {
  background: '#FFFFFF', border: '1px solid #E5E7EB',
  borderRadius: 10, overflow: 'hidden',
}
const tableStyle: CSSProperties = {
  width: '100%', borderCollapse: 'collapse', fontSize: 13,
}
const thStyle: CSSProperties = {
  textAlign: 'left', padding: '12px 14px', fontSize: 11,
  fontWeight: 600, color: '#6B7280', textTransform: 'uppercase',
  letterSpacing: '0.04em', borderBottom: '1px solid #E5E7EB',
}
const trStyle: CSSProperties = { borderBottom: '1px solid #F3F4F6' }
const tdStyle: CSSProperties = {
  padding: '10px 14px', color: '#0A0A0A', fontVariantNumeric: 'tabular-nums',
}
'@
Write-FileUtf8NoBom -Path "src/pages/AdminHealth.tsx" -Content $adminHealthTsx
Write-Host "  +  src/pages/AdminHealth.tsx" -ForegroundColor Green

# ============================================================
# 5. Patch App.tsx : import + route /admin/health
# ============================================================
$appPath = "src/App.tsx"
$app = Read-FileUtf8 $appPath
$app = $app -replace "\r?\n", "`r`n"

# Imports
if ($app -notmatch "import AdminHealth from") {
    $anchor = "import Rankings from './pages/Rankings';"
    if ($app.Contains($anchor)) {
        $app = $app.Replace($anchor, "$anchor`r`nimport AdminHealth from './pages/AdminHealth';`r`nimport { AdminGuard } from './components/AdminGuard';")
        Write-Host "  +  Imports AdminHealth + AdminGuard ajoutes" -ForegroundColor Green
    } else {
        Write-Host "WARN  Ancre 'import Rankings' non trouvee dans App.tsx" -ForegroundColor Yellow
    }
}

# Route /admin/health avant </Routes>
if ($app -notmatch 'path="/admin/health"') {
    $newRoute = @'
        <Route
          path="/admin/health"
          element={
            <ProtectedRoute>
              <AdminGuard>
                <AdminHealth />
              </AdminGuard>
            </ProtectedRoute>
          }
        />
      </Routes>
'@
    $app = $app.Replace("</Routes>", $newRoute.TrimStart())
    Write-Host "  +  Route /admin/health inseree" -ForegroundColor Green
}

Write-FileUtf8NoBom -Path $appPath -Content $app

# ============================================================
# Verifications
# ============================================================
Write-Host ""
Write-Host "Verifications :" -ForegroundColor Cyan
Get-ChildItem src/lib/admin.ts, src/lib/adminQueries.ts, src/components/AdminGuard.tsx, src/pages/AdminHealth.tsx -ErrorAction SilentlyContinue |
    ForEach-Object { "  + $($_.FullName.Replace((Get-Location).Path, '.').Replace('\','/'))" }
Select-String -Path $appPath -Pattern "AdminHealth|AdminGuard" |
    ForEach-Object { "  App L$($_.LineNumber) : $($_.Line.Trim())" }

Write-Host ""
Write-Host "=== Script 1/3 termine ===" -ForegroundColor Cyan
Write-Host "Acces : https://shooserie.tech/admin/health (apres deploy)" -ForegroundColor Yellow
Write-Host ""
