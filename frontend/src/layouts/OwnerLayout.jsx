import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import OwnerSidebar from './OwnerSidebar'
import { getMyBusiness } from '../api/providers'

export default function OwnerLayout({ title, subtitle, headerAction, children }) {
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [business, setBusiness] = useState(null)

  useEffect(() => {
    getMyBusiness().then(setBusiness).catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen" style={{ background: '#0D1520' }} dir="rtl">

      {/* Desktop sidebar */}
      <OwnerSidebar
        businessName={business?.name}
        businessCategory={business?.category_display}
      />

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 overflow-y-auto" style={{ background: '#132030', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
            <OwnerSidebar
              businessName={business?.name}
              businessCategory={business?.category_display}
            />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20"
                style={{ background: 'rgba(7,13,20,0.9)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(0,212,200,0.09)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: '#4A6E8A' }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-black" style={{ color: '#DCF0F5' }}>{title}</h1>
              {subtitle && <p className="text-xs" style={{ color: '#4A6E8A' }}>{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            <button
              onClick={() => { logout(); navigate('/login') }}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ color: '#4A6E8A' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#4A6E8A'}
            >
              خروج
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
