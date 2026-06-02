import { useNavigate, NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function MainLayout({ children }) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans" dir="rtl">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span
            className="text-lg font-bold text-blue-600 cursor-pointer"
            onClick={() => navigate('/doctors')}
          >
            نوبت‌دهی آنلاین
          </span>

          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/doctors"
              className={({ isActive }) =>
                isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-800 transition-colors'
              }
            >
              پزشکان
            </NavLink>
            {user && (
              <NavLink
                to="/my-appointments"
                className={({ isActive }) =>
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-800 transition-colors'
                }
              >
                نوبت‌های من
              </NavLink>
            )}
          </nav>
        </div>

        {user && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-medium">{user.full_name || user.phone}</span>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              خروج
            </button>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
