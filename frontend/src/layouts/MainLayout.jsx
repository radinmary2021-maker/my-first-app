import { useState } from 'react'
import { useNavigate, NavLink, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { isBusinessUser } from '../utils/roles'
import FeedbackWidget from '../components/FeedbackWidget'

export default function MainLayout({ children, fullWidth = false }) {
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  function handleLogout() {
    logout()
    navigate('/login')
  }

  const navLinkCls = ({ isActive }) =>
    `px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
      isActive
        ? 'bg-cyan-50 text-cyan-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`

  const isBiz = user && isBusinessUser(user.role)

  const bizNavLinks = (
    <>
      <NavLink to="/dashboard" end className={navLinkCls} onClick={() => setMobileOpen(false)}>
        داشبورد
      </NavLink>
      <NavLink to="/dashboard/providers" className={navLinkCls} onClick={() => setMobileOpen(false)}>
        ارائه‌دهندگان
      </NavLink>
      <NavLink to="/dashboard/schedule" className={navLinkCls} onClick={() => setMobileOpen(false)}>
        برنامه کاری
      </NavLink>
      <NavLink to="/dashboard/settings" className={navLinkCls} onClick={() => setMobileOpen(false)}>
        تنظیمات
      </NavLink>
      <NavLink to="/dashboard/reports" className={navLinkCls} onClick={() => setMobileOpen(false)}>
        گزارش مالی
      </NavLink>
    </>
  )

  const publicNavLinks = (
    <>
      <NavLink to="/providers" className={navLinkCls} onClick={() => setMobileOpen(false)}>
        کسب‌وکارها
      </NavLink>
      {user && !isBiz && (
        <NavLink to="/my-appointments" className={navLinkCls} onClick={() => setMobileOpen(false)}>
          نوبت‌های من
        </NavLink>
      )}
      <NavLink to="/about" className={navLinkCls} onClick={() => setMobileOpen(false)}>
        درباره ما
      </NavLink>
      <NavLink to="/contact" className={navLinkCls} onClick={() => setMobileOpen(false)}>
        تماس با ما
      </NavLink>
    </>
  )

  const navLinks = isBiz ? bizNavLinks : publicNavLinks

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-50
                   focus:bg-white focus:text-cyan-700 focus:px-4 focus:py-2 focus:rounded-lg
                   focus:shadow-lg focus:font-medium focus:text-sm"
      >
        رفتن به محتوا
      </a>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-400
                            flex items-center justify-center shadow-sm shadow-cyan-200
                            group-hover:shadow-cyan-300/60 transition-shadow">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                <rect x="3" y="4" width="18" height="18" rx="3" />
                <path d="M3 9h18" />
                <path d="M8 2v4M16 2v4" strokeLinecap="round" />
                <path d="M8 13h2M14 13h2M8 17h2M14 17h2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight"
                  style={{ background: 'linear-gradient(135deg,#0891B2,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Nobatic
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 shrink-0" aria-label="منوی اصلی">
            {navLinks}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg font-semibold transition-all ${
                      isActive ? 'text-cyan-700 bg-cyan-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {user.full_name || user.phone}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-all font-medium text-sm"
                >
                  خروج
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/create-business')}
                  className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  ثبت کسب‌وکار
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl
                             shadow-sm shadow-cyan-200 transition-colors"
                >
                  ورود / ثبت‌نام
                </button>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
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
        </div>

      </header>

      {/* ── Mobile dropdown nav ── */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-b border-slate-100 shadow-sm px-4 py-3 space-y-1 z-20 relative">
          <nav className="flex flex-col gap-1 text-sm" aria-label="منوی موبایل">
            {navLinks}
          </nav>
          {user ? (
            <div className="pt-2 border-t border-slate-100 mt-2 flex flex-col gap-1 text-sm">
              <NavLink to="/profile" className={navLinkCls} onClick={() => setMobileOpen(false)}>
                {user.full_name || user.phone}
              </NavLink>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false) }}
                className="px-3 py-2 rounded-lg text-right text-red-500 hover:bg-red-50 transition-all font-medium"
              >
                خروج
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 mt-2 space-y-2">
              <button
                onClick={() => { navigate('/create-business'); setMobileOpen(false) }}
                className="w-full text-sm font-semibold text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-200"
              >
                ثبت کسب‌وکار
              </button>
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
      <main id="main-content" className={fullWidth ? 'flex-1' : 'flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8'}>
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-400 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                    <rect x="3" y="4" width="18" height="18" rx="3" />
                    <path d="M3 9h18" /><path d="M8 2v4M16 2v4" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-base font-extrabold tracking-tight"
                      style={{ background: 'linear-gradient(135deg,#0891B2,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Nobatic
                </span>
              </div>
              <p className="text-sm leading-7 text-slate-400">
                رزرو آنلاین نوبت برای هر کسب‌وکاری — سریع، ساده و بدون تماس تلفنی.
              </p>
            </div>

            {/* شرکت */}
            <div>
              <h4 className="text-white text-sm font-bold mb-4">شرکت</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="hover:text-cyan-400 transition-colors">درباره ما</Link></li>
                <li><Link to="/contact" className="hover:text-cyan-400 transition-colors">تماس با ما</Link></li>
              </ul>
            </div>

            {/* کسب‌وکارها */}
            <div>
              <h4 className="text-white text-sm font-bold mb-4">کسب‌وکارها</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/create-business" className="hover:text-cyan-400 transition-colors">ثبت کسب‌وکار</Link></li>
                <li><Link to="/providers" className="hover:text-cyan-400 transition-colors">لیست کسب‌وکارها</Link></li>
              </ul>
            </div>

            {/* پشتیبانی */}
            <div>
              <h4 className="text-white text-sm font-bold mb-4">پشتیبانی</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/contact" className="hover:text-cyan-400 transition-colors">سوالات متداول</Link></li>
                <li><Link to="/terms" className="hover:text-cyan-400 transition-colors">قوانین و مقررات</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">© ۱۴۰۴ نوبتیک — تمامی حقوق محفوظ است</p>
            <span className="text-xs text-slate-500">پرداخت امن با زرین‌پال</span>
          </div>
        </div>
      </footer>

      {user && <FeedbackWidget />}
    </div>
  )
}
