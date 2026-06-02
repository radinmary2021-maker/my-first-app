import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Spinner from '../components/Spinner'

export default function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user)
  const hydrated = useAuthStore((s) => s.hydrated)
  const location = useLocation()

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
