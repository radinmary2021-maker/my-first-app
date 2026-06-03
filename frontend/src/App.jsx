import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import GuestRoute from './routes/GuestRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import { ToastContainer } from './components/Toast'
import { getCurrentUser } from './api/auth'
import { useAuthStore } from './store/authStore'

import LoginPage from './pages/auth/LoginPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'
import SetupProfilePage from './pages/auth/SetupProfilePage'
import DoctorListPage from './pages/public/DoctorListPage'
import DoctorDetailPage from './pages/public/DoctorDetailPage'
import BookAppointmentPage from './pages/patient/BookAppointmentPage'
import MyAppointmentsPage from './pages/patient/MyAppointmentsPage'
import PaymentResultPage from './pages/patient/PaymentResultPage'
import NotFoundPage from './pages/shared/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
})

function SessionRefresh() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser = useAuthStore((s) => s.setUser)

  useEffect(() => {
    // Refresh the stored user object once per session when already authenticated.
    // Catches server-side profile updates (e.g. admin edits full_name).
    if (!user || !accessToken) return
    getCurrentUser()
      .then((res) => setUser(res.data))
      .catch(() => {
        // 401 is handled by the Axios interceptor (refresh → retry or logout).
        // Any other failure is silent — stale user object is not catastrophic.
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount only

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionRefresh />
        <Routes>
          <Route path="/" element={<Navigate to="/doctors" replace />} />

          {/* Guest-only */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/verify-otp" element={<GuestRoute><VerifyOtpPage /></GuestRoute>} />
          <Route path="/setup-profile" element={<ProtectedRoute><SetupProfilePage /></ProtectedRoute>} />

          {/* Public */}
          <Route path="/doctors" element={<DoctorListPage />} />
          <Route path="/doctors/:id" element={<DoctorDetailPage />} />

          {/* Protected */}
          <Route path="/book/:id" element={<ProtectedRoute><BookAppointmentPage /></ProtectedRoute>} />
          <Route path="/my-appointments" element={<ProtectedRoute><MyAppointmentsPage /></ProtectedRoute>} />

          {/* Payment result — public, Zarinpal redirects here */}
          <Route path="/payment/result" element={<PaymentResultPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
