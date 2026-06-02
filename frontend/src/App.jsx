import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import GuestRoute from './routes/GuestRoute'
import ProtectedRoute from './routes/ProtectedRoute'

import LoginPage from './pages/auth/LoginPage'
import VerifyOtpPage from './pages/auth/VerifyOtpPage'
import DoctorListPage from './pages/public/DoctorListPage'
import NotFoundPage from './pages/shared/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/doctors" replace />} />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <GuestRoute>
                <VerifyOtpPage />
              </GuestRoute>
            }
          />

          <Route
            path="/doctors"
            element={
              <ProtectedRoute>
                <DoctorListPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
