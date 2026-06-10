import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { isBusinessUser } from '../utils/roles'
import Spinner from '../components/Spinner'

export default function GuestRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (user) {
    // Business users (owner / legacy provider) belong on the dashboard.
    // Customers return to the public provider listing.
    return <Navigate to={isBusinessUser(user.role) ? '/dashboard' : '/providers'} replace />
  }

  return children
}
