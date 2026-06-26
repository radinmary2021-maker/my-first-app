import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import { notify } from '../../utils/toast'
import { useAuthStore } from '../../store/authStore'
import { updateMe } from '../../api/auth'

const ROLE_LABEL = {
  customer: 'مشتری', owner: 'صاحب کسب‌وکار', provider: 'ارائه‌دهنده خدمت',
  secretary: 'منشی', admin: 'ادمین',
}

function getInitials(name) {
  if (!name) return '؟'
  const p = name.trim().split(' ')
  return p.length >= 2 ? p[0][0] + '.' + p[1][0] : p[0].slice(0, 2)
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)
  const setUser  = useAuthStore((s) => s.setUser)
  const logout   = useAuthStore((s) => s.logout)

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [saving,   setSaving]   = useState(false)

  if (!user) {
    return <MainLayout><div className="flex justify-center py-20"><Spinner /></div></MainLayout>
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim() || fullName.trim().length < 2) {
      notify('نام باید حداقل ۲ کاراکتر باشد.', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await updateMe({ full_name: fullName.trim() })
      setUser(res.data)
      notify('پروفایل به‌روزرسانی شد.', 'success')
    } catch (err) {
      notify(err?.response?.data?.full_name?.[0] || 'خطا در ذخیره اطلاعات.', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Profile header */}
        <div className="rounded-3xl p-6" style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.07)' }}>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0"
                 style={{ background: 'rgba(0,212,200,0.1)', color: '#00D4C8' }}>
              {getInitials(user.full_name)}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-black" style={{ color: '#DCF0F5' }}>{user.full_name || '—'}</h1>
              <p className="text-sm mt-0.5 font-mono" dir="ltr" style={{ color: '#4A6E8A' }}>{user.phone}</p>
              <span className="inline-block text-xs font-bold px-3 py-1 rounded-full mt-2"
                    style={{ background: 'rgba(0,212,200,0.15)', color: '#00D4C8' }}>
                {ROLE_LABEL[user.role] || user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 text-center" style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.07)' }}>
            <div className="text-xl font-black" style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>—</div>
            <div className="text-[11px] mt-0.5" style={{ color: '#4A6E8A' }}>نوبت تکمیل‌شده</div>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.07)' }}>
            <div className="text-xl font-black" style={{ background: 'linear-gradient(135deg,#39FF14,#00D4C8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>—</div>
            <div className="text-[11px] mt-0.5" style={{ color: '#4A6E8A' }}>کسب‌وکار ذخیره‌شده</div>
          </div>
          <div className="rounded-2xl p-4 text-center" style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.07)' }}>
            <div className="text-xl font-black" style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>—</div>
            <div className="text-[11px] mt-0.5" style={{ color: '#4A6E8A' }}>میانگین امتیاز شما</div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4" style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.07)' }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: '#DCF0F5' }}>اطلاعات شخصی</h2>
          <div>
            <label htmlFor="profile-name" className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>نام و نام خانوادگی</label>
            <input
              id="profile-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="نام خود را وارد کنید"
              disabled={saving}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
              style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.18)', color: '#DCF0F5' }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(0,212,200,0.45)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0,212,200,0.18)'}
            />
          </div>
          <div>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>شماره موبایل</label>
            <div className="flex items-center rounded-xl px-4 py-3" style={{ background: '#1A2A3E', border: '1px solid rgba(0,212,200,0.07)' }}>
              <span className="text-sm" dir="ltr" style={{ color: '#4A6E8A' }}>{user.phone}</span>
              <svg className="w-3.5 h-3.5 mr-auto" style={{ color: '#4A6E8A' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: '#4A6E8A' }}>شماره موبایل قابل تغییر نیست</p>
          </div>
          <button
            type="submit"
            disabled={saving || fullName.trim() === (user.full_name ?? '')}
            className="w-full text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
          >
            {saving ? <Spinner size="xs" light /> : 'ذخیره تغییرات'}
          </button>
        </form>

        {/* Menu */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.07)' }}>
          <button onClick={() => navigate('/my-appointments')} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors"
                  style={{ borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
            <svg className="w-[18px] h-[18px]" style={{ color: '#00D4C8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /><path d="M8 2v4M16 2v4" /></svg>
            <span className="text-sm font-semibold flex-1 text-right" style={{ color: '#DCF0F5' }}>نوبت‌های من</span>
            <svg className="w-4 h-4 rotate-180" style={{ color: '#4A6E8A' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          </button>
          <button onClick={() => navigate('/contact')} className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
            <svg className="w-[18px] h-[18px]" style={{ color: '#00D4C8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.63 19a20.49 20.49 0 0 1-4.83-4.72 19.79 19.79 0 0 1-3.06-8.53A2 2 0 0 1 5.11 4h3a2 2 0 0 1 2 1.72 12 12 0 0 0 .66 2.65 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6.29 6.29l1.19-1.19a2 2 0 0 1 2.11-.45 12 12 0 0 0 2.65.66A2 2 0 0 1 22 16.92z" /></svg>
            <span className="text-sm font-semibold flex-1 text-right" style={{ color: '#DCF0F5' }}>پشتیبانی</span>
            <svg className="w-4 h-4 rotate-180" style={{ color: '#4A6E8A' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          خروج از حساب کاربری
        </button>

      </div>
    </MainLayout>
  )
}
