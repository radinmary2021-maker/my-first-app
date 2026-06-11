import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { isBusinessUser } from '../utils/roles'
import Spinner from '../components/Spinner'

/**
 * Route guard for business management pages (dashboard, schedule, etc.)
 *
 * Allows:
 *   - role='owner'    — new business accounts (post SaaS refactor)
 *   - role='provider' — legacy accounts (backward compat, pre-refactor)
 *
 * Redirects unauthenticated users to /login.
 * Redirects customers (role='customer') to /providers.
 */
export default function DoctorRoute({ children }) {
  const user     = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!isBusinessUser(user.role)) return <Navigate to="/create-business" replace />

  return children
}
