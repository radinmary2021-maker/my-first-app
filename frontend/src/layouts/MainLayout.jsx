import { useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { isBusinessUser } from '../utils/roles'
import FeedbackWidget from '../components/FeedbackWidget'

export default function MainLayout({ children }) {
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navLinkCls = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg transition-all font-medium ${
      isActive
        ? 'bg-cyan-50 text-cyan-700'
        : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
    }`

  const isBiz = user && isBusinessUser(user.role)

  const navLinks = (
    <>
      {/* Public list — hidden for business users (they manage via /dashboard/providers) */}
      {!isBiz && (
        <NavLink to="/providers" className={navLinkCls} onClick={() => setMobileOpen(false)}>
          ارائه‌دهندگان
        </NavLink>
      )}
      {user && !isBiz && (
        <NavLink to="/my-appointments" className={navLinkCls} onClick={() => setMobileOpen(false)}>
          نوبت‌های من
        </NavLink>
      )}
      {isBiz && (
        <NavLink to="/dashboard" end className={navLinkCls} onClick={() => setMobileOpen(false)}>
          داشبورد
        </NavLink>
      )}
      {isBiz && (
        <NavLink to="/dashboard/providers" className={navLinkCls} onClick={() => setMobileOpen(false)}>
          ارائه‌دهندگان
        </NavLink>
      )}
      {isBiz && (
        <NavLink to="/dashboard/schedule" className={navLinkCls} onClick={() => setMobileOpen(false)}>
          برنامه کاری
        </NavLink>
      )}
    </>
  )

  return (
    <div className="min-h-screen bg-cyan-50/40 font-sans" dir="rtl">
      {/* Skip-to-content for keyboard/screen-reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-50
                   focus:bg-white focus:text-cyan-700 focus:px-4 focus:py-2 focus:rounded-lg
                   focus:shadow-lg focus:font-medium focus:text-sm"
      >
        رفتن به محتوا
      </a>
      {/* ── Header ── */}
      <header
        className="bg-white/95 backdrop-blur-md border-b border-cyan-100/60 shadow-sm sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between"
        style={{ height: 64 }}
      >
        {/* Logo + Desktop Nav */}
        <div className="flex items-center gap-6">
          <button className="flex items-center gap-2 group" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600
                            flex items-center justify-center shadow-md shadow-cyan-100/50
                            group-hover:shadow-cyan-300/60 transition-shadow">
              {/* Calendar / booking icon — universal, not medical */}
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                <rect x="3" y="4" width="18" height="18" rx="3" />
                <path d="M3 9h18" />
                <path d="M8 2v4M16 2v4" />
                <path d="M8 13h2M14 13h2M8 17h2M14 17h2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-lg font-extrabold bg-gradient-to-l from-cyan-700 to-cyan-500
                             bg-clip-text text-transparent tracking-tight">
              Nobatic
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 text-sm" aria-label="منوی اصلی">
            {navLinks}
          </nav>
        </div>

        {/* Right side: user area + mobile hamburger */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg font-semibold transition-all ${
                    isActive ? 'text-cyan-700 bg-cyan-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                {user.full_name || user.phone}
              </NavLink>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-all font-medium"
              >
                خروج
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:block bg-cyan-500 text-white text-sm font-semibold px-4 py-2 rounded-xl
                         hover:bg-cyan-600 shadow-md shadow-cyan-100/50 transition-all"
            >
              ورود / ثبت‌نام
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'بستن منو' : 'باز کردن منو'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* ── Mobile dropdown nav ── */}
      {mobileOpen && (
        <div className="sm:hidden bg-white border-b border-gray-100 shadow-sm px-4 py-3 space-y-1 z-20 relative">
          <nav className="flex flex-col gap-1 text-sm" aria-label="منوی موبایل">
            {navLinks}
          </nav>
          {user ? (
            <div className="pt-2 border-t border-gray-100 mt-2 flex flex-col gap-1 text-sm">
              <NavLink
                to="/profile"
                className={navLinkCls}
                onClick={() => setMobileOpen(false)}
              >
                {user.full_name || user.phone}
              </NavLink>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false) }}
                className="px-3 py-1.5 rounded-lg text-right text-red-500 hover:bg-red-50 transition-all font-medium"
              >
                خروج
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-100 mt-2">
              <button
                onClick={() => { navigate('/login'); setMobileOpen(false) }}
                className="w-full bg-cyan-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-cyan-600 transition-all"
              >
                ورود / ثبت‌نام
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>

      {/* Beta feedback — only shown to authenticated users */}
      {user && <FeedbackWidget />}
    </div>
  )
}
