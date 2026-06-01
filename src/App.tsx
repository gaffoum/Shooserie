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
import { MyListings } from '@/pages/MyListings'
import { ResetPassword } from '@/pages/ResetPassword'
import { SharedCollection } from '@/pages/SharedCollection'
import { Marketplace } from '@/pages/Marketplace'
import { MarketplaceDetail } from '@/pages/MarketplaceDetail'
import { Messaging } from '@/pages/Messaging'
import { PseudoSetupGuard } from './components/PseudoSetupGuard'
import UserProfile from './pages/UserProfile';
import Community from './pages/Community';
import Rankings from './pages/Rankings';
import Labels from './pages/Labels';
import CGV from './pages/CGV';
import MyOrders from './pages/MyOrders';
import OrderSuccess from './pages/OrderSuccess';
import CheckoutLabels from './pages/CheckoutLabels';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
	<PseudoSetupGuard />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          {/* Public ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â reached via the email link Supabase sends after a
            * password reset request. The recovery token in the URL hash
            * creates a temporary session that lets the user set a new
            * password without going through normal login. */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Public ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â anyone with the token can view. No auth required. */}
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
            path="/ventes"
            element={
              <ProtectedRoute>
                <MyListings />
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
			<Route
			  path="/marketplace"
			  element={
				<ProtectedRoute>
				  <Marketplace />
				</ProtectedRoute>
			  }
			/>
			<Route
			  path="/marketplace/:id"
			  element={
				<ProtectedRoute>
				  <MarketplaceDetail />
				</ProtectedRoute>
			  }
			/>
			<Route
			  path="/messages"
			  element={
				<ProtectedRoute>
				  <Messaging />
				</ProtectedRoute>
			  }
			/>

          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            }
          />
          <Route path="/u/:pseudo" element={<UserProfile />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/rankings"
          element={
            <ProtectedRoute>
              <Rankings />
            </ProtectedRoute>
          }
        />
      <Route
          path="/labels"
          element={
            <ProtectedRoute>
              <Labels />
            </ProtectedRoute>
          }
        />
      <Route
          path="/checkout-labels"
          element={
            <ProtectedRoute>
              <CheckoutLabels />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id/success"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />
        <Route path="/cgv" element={<CGV />} />
      <Route
          path="/admin/orders"
          element={
            <ProtectedRoute>
              <AdminGuard>
                <AdminOrders />
              </AdminGuard>
            </ProtectedRoute>
          }
        />
      </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
