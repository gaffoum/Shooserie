import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { SneakerNew } from '@/pages/SneakerNew'
import { SneakerDetail } from '@/pages/SneakerDetail'
import { SneakerEdit } from '@/pages/SneakerEdit'
import { Account } from '@/pages/Account'
import { Admin } from '@/pages/Admin'
import { ResetPassword } from '@/pages/ResetPassword'
import { SharedCollection } from '@/pages/SharedCollection'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          {/* Public — reached via the email link Supabase sends after a
            * password reset request. The recovery token in the URL hash
            * creates a temporary session that lets the user set a new
            * password without going through normal login. */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Public — anyone with the token can view. No auth required. */}
          <Route path="/share/:token" element={<SharedCollection />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sneakers/new"
            element={
              <ProtectedRoute>
                <SneakerNew />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sneakers/:id"
            element={
              <ProtectedRoute>
                <SneakerDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sneakers/:id/edit"
            element={
              <ProtectedRoute>
                <SneakerEdit />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
