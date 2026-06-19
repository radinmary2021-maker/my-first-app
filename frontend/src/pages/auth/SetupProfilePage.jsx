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
    <div className="min-h-screen" dir="rtl"
         style={{ background: 'linear-gradient(135deg, #DDE4FF 0%, #C7D2FE 30%, #CFFAFE 65%, #F8FAFC 100%)' }}>

      {/* Logo */}
      <div className="px-6 py-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shadow-cyan-200"
               style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <path d="M3 9h18" /><path d="M8 2v4M16 2v4" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-lg font-extrabold"
                style={{ background: 'linear-gradient(135deg,#0891B2,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Nobatic
          </span>
        </button>
      </div>

      {/* Card */}
      <div className="flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-8">

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-cyan-200"
                 style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}>
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="text-xl font-black text-slate-900 mb-2">تکمیل پروفایل</h1>
            <p className="text-slate-500 text-sm leading-6">چند قدم تا شروع — اطلاعات خودت رو کامل کن</p>
            {user?.phone && (
              <p className="text-xs text-slate-400 mt-1 font-mono" dir="ltr">{user.phone}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label htmlFor="full-name" className="text-xs font-bold text-slate-600 mb-2 block">
              نام و نام خانوادگی <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3.5 mb-5
                            focus-within:border-cyan-400 focus-within:bg-white transition-colors">
              <svg className="w-5 h-5 text-slate-400 ml-2 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: سارا محمدی"
                className="bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full font-medium"
                disabled={loading}
                autoFocus
                autoComplete="name"
              />
            </div>

            <label className="text-xs font-bold text-slate-600 mb-3 block">می‌خواهید چطور از نوبتیک استفاده کنید؟</label>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setAccountType('customer')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${
                  accountType === 'customer'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-200 hover:border-cyan-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  accountType === 'customer' ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                <span className={`text-xs font-bold ${accountType === 'customer' ? 'text-cyan-700' : 'text-slate-600'}`}>
                  رزرو نوبت می‌خواهم
                </span>
                <span className={`text-[10px] ${accountType === 'customer' ? 'text-cyan-600/70' : 'text-slate-400'}`}>
                  مشتری
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('owner')}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-colors ${
                  accountType === 'owner'
                    ? 'border-cyan-500 bg-cyan-50'
                    : 'border-slate-200 hover:border-cyan-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  accountType === 'owner' ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" />
                  </svg>
                </div>
                <span className={`text-xs font-bold ${accountType === 'owner' ? 'text-cyan-700' : 'text-slate-600'}`}>
                  کسب‌وکار دارم
                </span>
                <span className={`text-[10px] ${accountType === 'owner' ? 'text-cyan-600/70' : 'text-slate-400'}`}>
                  صاحب کسب‌وکار
                </span>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !fullName.trim()}
              className="w-full text-white font-black py-4 rounded-2xl text-sm hover:opacity-90 transition-opacity
                         shadow-lg shadow-cyan-200 flex items-center justify-center
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
            >
              {loading ? <Spinner size="xs" light /> : 'تکمیل و ورود به نوبتیک'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
