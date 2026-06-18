import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import GuestRoute from './routes/GuestRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import DoctorRoute from './routes/DoctorRoute'
import { ToastContainer } from './components/Toast'
import Spinner from './components/Spinner'
import { getCurrentUser } from './api/auth'
import { useAuthStore } from './store/authStore'

// ── Route-level code splitting ─────────────────────────────────────────────
const HomePage            = lazy(() => import('./pages/public/HomePage'))
const LoginPage           = lazy(() => import('./pages/auth/LoginPage'))
const VerifyOtpPage       = lazy(() => import('./pages/auth/VerifyOtpPage'))
const SetupProfilePage    = lazy(() => import('./pages/auth/SetupProfilePage'))
const DoctorListPage      = lazy(() => import('./pages/public/DoctorListPage'))
const DoctorDetailPage    = lazy(() => import('./pages/public/DoctorDetailPage'))
const SearchPage          = lazy(() => import('./pages/public/SearchPage'))
const BookAppointmentPage = lazy(() => import('./pages/patient/BookAppointmentPage'))
const MyAppointmentsPage  = lazy(() => import('./pages/patient/MyAppointmentsPage'))
const PaymentResultPage   = lazy(() => import('./pages/patient/PaymentResultPage'))
const NotFoundPage        = lazy(() => import('./pages/shared/NotFoundPage'))
const ProfilePage         = lazy(() => import('./pages/shared/ProfilePage'))
const DashboardPage       = lazy(() => import('./pages/doctor/DashboardPage'))
const SchedulePage        = lazy(() => import('./pages/doctor/SchedulePage'))
const CreateBusinessPage  = lazy(() => import('./pages/owner/CreateBusinessPage'))
const ProvidersPage       = lazy(() => import('./pages/owner/ProvidersPage'))
const SettingsPage        = lazy(() => import('./pages/owner/SettingsPage'))
const ReportsPage         = lazy(() => import('./pages/owner/ReportsPage'))
const AboutPage           = lazy(() => import('./pages/public/AboutPage'))
const ContactPage         = lazy(() => import('./pages/public/ContactPage'))
const TermsPage           = lazy(() => import('./pages/public/TermsPage'))

// ── Query client ───────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          60_000,        // 1 min — cached data stays fresh
      gcTime:             5 * 60_000,    // 5 min — unused cache eviction
      retry:              1,
      refetchOnWindowFocus: false,       // prevents jarring re-fetches on tab switch
    },
  },
})

// ── Route-level loading fallback ───────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" dir="rtl">
      <Spinner />
    </div>
  )
}

function SessionRefresh() {
  const user        = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const setUser     = useAuthStore((s) => s.setUser)

  useEffect(() => {
    if (!user || !accessToken) return
    getCurrentUser()
      .then((res) => setUser(res.data))
      .catch(() => {
        // 401 handled by Axios interceptor; other failures are silent
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally run once on mount

  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SessionRefresh />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />

            {/* Guest-only */}
            <Route path="/login"        element={<GuestRoute><LoginPage /></GuestRoute>} />
            <Route path="/verify-otp"   element={<GuestRoute><VerifyOtpPage /></GuestRoute>} />
            <Route path="/setup-profile" element={<ProtectedRoute><SetupProfilePage /></ProtectedRoute>} />

            {/* Business onboarding */}
            <Route path="/create-business" element={<ProtectedRoute><CreateBusinessPage /></ProtectedRoute>} />

            {/* Search */}
            <Route path="/search"        element={<SearchPage />} />
            <Route path="/about"         element={<AboutPage />} />
            <Route path="/contact"       element={<ContactPage />} />
            <Route path="/terms"         element={<TermsPage />} />

            {/* Public providers */}
            <Route path="/providers"     element={<DoctorListPage />} />
            <Route path="/providers/:id" element={<DoctorDetailPage />} />
            {/* Public slug-based provider page (shareable) */}
            <Route path="/book/:slug"    element={<DoctorDetailPage />} />
            {/* Legacy aliases */}
            <Route path="/doctors"     element={<Navigate to="/providers" replace />} />
            <Route path="/doctors/:id" element={<Navigate to="/providers/:id" replace />} />

            {/* Protected */}
            <Route path="/booking/:id"     element={<ProtectedRoute><BookAppointmentPage /></ProtectedRoute>} />
            <Route path="/my-appointments" element={<ProtectedRoute><MyAppointmentsPage /></ProtectedRoute>} />

            {/* Payment result — public (Zarinpal redirects here) */}
            <Route path="/payment/result" element={<PaymentResultPage />} />

            {/* Profile */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            {/* Doctor / Owner dashboard */}
            <Route path="/dashboard"            element={<DoctorRoute><DashboardPage /></DoctorRoute>} />
            <Route path="/dashboard/schedule"  element={<DoctorRoute><SchedulePage /></DoctorRoute>} />
            <Route path="/dashboard/providers" element={<DoctorRoute><ProvidersPage /></DoctorRoute>} />
            <Route path="/dashboard/settings"  element={<DoctorRoute><SettingsPage /></DoctorRoute>} />
            <Route path="/dashboard/reports"   element={<DoctorRoute><ReportsPage /></DoctorRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
        <ToastContainer />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
