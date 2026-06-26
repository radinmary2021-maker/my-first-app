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
        ? 'text-[#00D4C8]'
        : 'text-[#4A6E8A] hover:text-[#00D4C8]'
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
    <div className="min-h-screen flex flex-col" style={{ background: '#0D1520', color: '#DCF0F5' }} dir="rtl">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:z-50
                   focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium focus:text-sm"
        style={{ background: '#132030', color: '#00D4C8' }}
      >
        رفتن به محتوا
      </a>

      {/* ── Header ── */}
      <header className="sticky top-0 z-30" style={{ background: 'rgba(7,13,20,0.9)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(0,212,200,0.09)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4" style={{ height: '66px' }}>

          {/* Logo */}
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', boxShadow: '0 0 20px rgba(0,212,200,0.35)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-[19px] h-[19px]">
                <rect x="3" y="4" width="18" height="18" rx="3" />
                <path d="M3 9h18" /><path d="M8 2v4M16 2v4" strokeLinecap="round" />
                <path d="M8 13h2M14 13h2M8 17h2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[19px] font-black" style={{ letterSpacing: '-0.02em', background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Nobatic
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5 shrink-0" aria-label="منوی اصلی">
            {navLinks}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2.5 shrink-0">
            {user ? (
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg font-semibold transition-all ${
                      isActive ? 'text-[#00D4C8]' : 'text-[#4A6E8A] hover:text-[#00D4C8]'
                    }`
                  }
                >
                  {user.full_name || user.phone}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg text-red-400 hover:text-red-300 transition-all font-medium text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)' }}
                >
                  خروج
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/create-business')}
                  className="hidden sm:flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl cursor-pointer transition-all"
                  style={{ color: '#00D4C8', border: '1px solid rgba(0,212,200,0.3)', background: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,200,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,200,0.6)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,212,200,0.3)' }}
                >
                  ثبت کسب‌وکار
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="text-white text-sm font-extrabold px-5 py-2.5 rounded-xl cursor-pointer transition-all"
                  style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 36px rgba(255,107,43,0.5)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 0 24px rgba(255,107,43,0.35)' }}
                >
                  ورود / ثبت‌نام
                </button>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: '#4A6E8A' }}
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
        <div className="lg:hidden px-4 py-3 space-y-1 z-20 relative" style={{ background: '#132030', borderBottom: '1px solid rgba(0,212,200,0.09)' }}>
          <nav className="flex flex-col gap-1 text-sm" aria-label="منوی موبایل">
            {navLinks}
          </nav>
          {user ? (
            <div className="pt-2 mt-2 flex flex-col gap-1 text-sm" style={{ borderTop: '1px solid rgba(0,212,200,0.07)' }}>
              <NavLink to="/profile" className={navLinkCls} onClick={() => setMobileOpen(false)}>
                {user.full_name || user.phone}
              </NavLink>
              <button
                onClick={() => { handleLogout(); setMobileOpen(false) }}
                className="px-3 py-2 rounded-lg text-right text-red-400 hover:text-red-300 transition-all font-medium"
              >
                خروج
              </button>
            </div>
          ) : (
            <div className="pt-2 mt-2 space-y-2" style={{ borderTop: '1px solid rgba(0,212,200,0.07)' }}>
              <button
                onClick={() => { navigate('/create-business'); setMobileOpen(false) }}
                className="w-full text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                style={{ color: '#00D4C8', border: '1px solid rgba(0,212,200,0.3)', background: 'transparent' }}
              >
                ثبت کسب‌وکار
              </button>
              <button
                onClick={() => { navigate('/login'); setMobileOpen(false) }}
                className="w-full text-white text-sm font-extrabold px-4 py-2.5 rounded-xl transition-all"
                style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
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
      <footer style={{ background: '#132030', borderTop: '1px solid rgba(0,212,200,0.08)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-[9px] flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', boxShadow: '0 0 14px rgba(0,212,200,0.3)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                    <rect x="3" y="4" width="18" height="18" rx="3" />
                    <path d="M3 9h18" /><path d="M8 2v4M16 2v4" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-base font-black"
                      style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Nobatic
                </span>
              </div>
              <p className="text-sm leading-7" style={{ color: '#4A6E8A' }}>
                رزرو آنلاین نوبت برای هر کسب‌وکاری
              </p>
            </div>

            {/* شرکت */}
            <div>
              <h4 className="text-xs font-extrabold mb-4 tracking-wider uppercase" style={{ color: '#DCF0F5' }}>شرکت</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="transition-colors" style={{ color: '#4A6E8A' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00D4C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#4A6E8A'}>درباره ما</Link></li>
                <li><Link to="/contact" className="transition-colors" style={{ color: '#4A6E8A' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00D4C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#4A6E8A'}>تماس با ما</Link></li>
              </ul>
            </div>

            {/* کسب‌وکارها */}
            <div>
              <h4 className="text-xs font-extrabold mb-4 tracking-wider uppercase" style={{ color: '#DCF0F5' }}>کسب‌وکارها</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/create-business" className="transition-colors" style={{ color: '#4A6E8A' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00D4C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#4A6E8A'}>ثبت کسب‌وکار</Link></li>
                <li><Link to="/providers" className="transition-colors" style={{ color: '#4A6E8A' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00D4C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#4A6E8A'}>پنل مدیریت</Link></li>
              </ul>
            </div>

            {/* پشتیبانی */}
            <div>
              <h4 className="text-xs font-extrabold mb-4 tracking-wider uppercase" style={{ color: '#DCF0F5' }}>پشتیبانی</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/terms" className="transition-colors" style={{ color: '#4A6E8A' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00D4C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#4A6E8A'}>قوانین</Link></li>
                <li><Link to="/contact" className="transition-colors" style={{ color: '#4A6E8A' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00D4C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#4A6E8A'}>سوالات متداول</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(0,212,200,0.07)' }}>
            <p className="text-xs" style={{ color: '#4A6E8A' }}>© ۱۴۰۴ Nobatic — تمامی حقوق محفوظ است</p>
            <span className="text-xs" style={{ color: '#4A6E8A' }}>پرداخت امن با زرین‌پال</span>
          </div>
        </div>
      </footer>

      {user && <FeedbackWidget />}
    </div>
  )
}
