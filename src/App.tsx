import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { SneakerNew } from '@/pages/SneakerNew'
import { SneakerDetail } from '@/pages/SneakerDetail'
import { SneakerEdit } from '@/pages/SneakerEdit'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
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
