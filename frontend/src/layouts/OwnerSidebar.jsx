import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const NAV_ITEMS = [
  {
    label: 'داشبورد', path: '/dashboard', end: true,
    icon: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  },
  {
    label: 'برنامه نوبت‌ها', path: '/dashboard/schedule',
    icon: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /><path d="M8 2v4M16 2v4" /></>,
  },
  {
    label: 'متخصصان', path: '/dashboard/providers',
    icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  },
  {
    label: 'گزارش‌ها', path: '/dashboard/reports',
    icon: <path d="M18 20V10M12 20V4M6 20v-6" />,
  },
  {
    label: 'تنظیمات', path: '/dashboard/settings',
    icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  },
]

function getInitials(name) {
  if (!name) return '؟'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return parts[0][0] + '.' + parts[1][0]
  return parts[0].slice(0, 2)
}

export default function OwnerSidebar({ businessName, businessCategory }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)

  function isActive(item) {
    if (item.end) return pathname === item.path
    return pathname.startsWith(item.path)
  }

  return (
    <aside className="w-64 hidden lg:flex flex-col shrink-0" style={{ background: '#0C1520', borderLeft: '1px solid rgba(0,212,200,0.07)' }}>
      {/* Logo */}
      <div className="flex items-center px-5" style={{ height: '66px', borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', boxShadow: '0 0 14px rgba(0,212,200,0.3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
              <rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /><path d="M8 2v4M16 2v4" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-base font-black"
                style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Nobatic
          </span>
        </button>
      </div>

      {/* Business switcher */}
      {businessName && (
        <div className="p-3" style={{ borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: 'rgba(0,212,200,0.05)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0"
                 style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', color: 'white' }}>
              📋
            </div>
            <div className="text-right flex-1 min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: '#DCF0F5' }}>{businessName}</div>
              {businessCategory && <div className="text-[10px]" style={{ color: '#4A6E8A' }}>{businessCategory}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
              style={active
                ? { background: 'rgba(0,212,200,0.08)', color: '#00D4C8', fontWeight: 700 }
                : { color: '#4A6E8A', fontWeight: 500 }
              }
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(0,212,200,0.04)'; e.currentTarget.style.color = '#DCF0F5' } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4A6E8A' } }}
            >
              <svg className="w-[18px] h-[18px]"
                   style={{ color: active ? '#00D4C8' : '#4A6E8A' }}
                   viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {item.icon}
              </svg>
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Profile */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(0,212,200,0.07)' }}>
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-colors"
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,212,200,0.04)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
               style={{ background: 'rgba(0,212,200,0.1)', color: '#00D4C8' }}>
            {getInitials(user?.full_name)}
          </div>
          <div className="text-right flex-1 min-w-0">
            <div className="text-xs font-bold truncate" style={{ color: '#DCF0F5' }}>{user?.full_name || user?.phone}</div>
            <div className="text-[10px]" style={{ color: '#4A6E8A' }}>مدیر کسب‌وکار</div>
          </div>
        </button>
      </div>
    </aside>
  )
}
