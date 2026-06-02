import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import GuestRoute from './routes/GuestRoute'
import ProtectedRoute from './routes/ProtectedRoute'
import { ToastContainer } from './components/Toast'

import LoginPage from './pages/auth/LoginPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/doctors" replace />} />

          {/* Guest-only */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/verify-otp" element={<GuestRoute><VerifyOtpPage /></GuestRoute>} />

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
