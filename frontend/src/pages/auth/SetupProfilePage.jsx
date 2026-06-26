import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../../components/Spinner'

export default function SetupProfilePage() {
  const navigate = useNavigate()
  const setUser  = useAuthStore((s) => s.setUser)
  const user     = useAuthStore((s) => s.user)

  const [fullName,    setFullName]    = useState('')
  const [accountType, setAccountType] = useState('customer')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = fullName.trim()
    if (trimmed.length < 2) {
      setError('نام باید حداقل ۲ کاراکتر باشد.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const updatedUser = await updateProfile({ fullName: trimmed })
      setUser(updatedUser)
      if (accountType === 'owner') {
        navigate('/create-business', { replace: true })
      } else {
        navigate('/providers', { replace: true })
      }
    } catch (err) {
      const msg = err?.response?.data?.full_name?.[0] || err?.response?.data?.error
      setError(msg || 'خطا در ذخیره اطلاعات. دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid-bg" dir="rtl"
         style={{ background: '#162030' }}>

      {/* Logo */}
      <div className="px-6 py-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #00D4C8 0%, #00A8FF 100%)', boxShadow: '0 0 16px rgba(0,212,200,0.3)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <path d="M3 9h18" /><path d="M8 2v4M16 2v4" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-lg font-extrabold"
                style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Nobatic
          </span>
        </button>
      </div>

      {/* Card */}
      <div className="flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-3xl p-8"
             style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                 style={{ background: 'linear-gradient(135deg, #00D4C8 0%, #00A8FF 100%)', boxShadow: '0 0 24px rgba(0,212,200,0.3)' }}>
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="text-xl font-black mb-2"
                style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              تکمیل پروفایل
            </h1>
            <p className="text-sm leading-6" style={{ color: '#6B8FAD' }}>چند قدم تا شروع — اطلاعات خودت رو کامل کن</p>
            {user?.phone && (
              <p className="text-xs mt-1 font-mono" dir="ltr" style={{ color: '#6B8FAD' }}>{user.phone}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="full-name" className="text-xs font-bold mb-2 block" style={{ color: '#6B8FAD' }}>
              نام و نام خانوادگی <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div className="flex items-center rounded-2xl px-4 py-3.5 mb-5 transition-colors"
                 style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.18)' }}>
              <svg className="w-5 h-5 ml-2 shrink-0" style={{ color: '#6B8FAD' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: سارا محمدی"
                className="bg-transparent outline-none text-sm w-full font-medium"
                style={{ color: '#E8F4FF', '::placeholder': { color: '#6B8FAD' } }}
                disabled={loading}
                autoFocus
                autoComplete="name"
              />
            </div>

            <label className="text-xs font-bold mb-3 block" style={{ color: '#6B8FAD' }}>می‌خواهید چطور از نوبتیک استفاده کنید؟</label>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setAccountType('customer')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors"
                style={{
                  border: accountType === 'customer' ? '2px solid #00D4C8' : '2px solid rgba(0,212,200,0.12)',
                  background: accountType === 'customer' ? 'rgba(0,212,200,0.1)' : 'transparent',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{
                       background: accountType === 'customer' ? '#00D4C8' : 'rgba(0,212,200,0.1)',
                       color: accountType === 'customer' ? 'white' : '#6B8FAD',
                     }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <span className="text-xs font-bold" style={{ color: accountType === 'customer' ? '#00D4C8' : '#E8F4FF' }}>
                  رزرو نوبت می‌خواهم
                </span>
                <span className="text-[10px]" style={{ color: accountType === 'customer' ? 'rgba(0,212,200,0.7)' : '#6B8FAD' }}>
                  مشتری
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('owner')}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-colors"
                style={{
                  border: accountType === 'owner' ? '2px solid #00D4C8' : '2px solid rgba(0,212,200,0.12)',
                  background: accountType === 'owner' ? 'rgba(0,212,200,0.1)' : 'transparent',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{
                       background: accountType === 'owner' ? '#00D4C8' : 'rgba(0,212,200,0.1)',
                       color: accountType === 'owner' ? 'white' : '#6B8FAD',
                     }}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" />
                  </svg>
                </div>
                <span className="text-xs font-bold" style={{ color: accountType === 'owner' ? '#00D4C8' : '#E8F4FF' }}>
                  کسب‌وکار دارم
                </span>
                <span className="text-[10px]" style={{ color: accountType === 'owner' ? 'rgba(0,212,200,0.7)' : '#6B8FAD' }}>
                  صاحب کسب‌وکار
                </span>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm rounded-2xl px-4 py-3 mb-4 text-center"
                   style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="w-full text-white font-black py-4 rounded-2xl text-sm hover:opacity-90 transition-opacity
                         flex items-center justify-center
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
            >
              {loading ? <Spinner size="xs" light /> : 'تکمیل و ورود به نوبتیک'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
