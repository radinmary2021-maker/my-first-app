import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { sendOtp } from '../../api/auth'
import Spinner from '../../components/Spinner'

function formatWait(s) {
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m === 0) return `${s} ثانیه`
  if (r === 0) return `${m} دقیقه`
  return `${m} دقیقه و ${r} ثانیه`
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (countdown <= 0) return
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timerRef.current); setError(''); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [countdown])

  const isValidPhone = /^09\d{9}$/.test(phone)
  const isBlocked    = countdown > 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!isValidPhone) {
      setError('شماره موبایل معتبر وارد کنید (مثال: ۰۹۱۲۰۰۰۰۰۰۱)')
      return
    }
    setLoading(true)
    try {
      await sendOtp(phone)
      navigate('/verify-otp', { state: { phone } })
    } catch (err) {
      if (err.response?.status === 429) {
        const seconds = err.response?.data?.retry_after_seconds ?? 60
        setCountdown(seconds)
        setError('')
      } else {
        const msg = err.response?.data?.message || err.response?.data?.error
        setError(msg || 'خطا در ارسال کد. لطفاً دوباره تلاش کنید.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid-bg" dir="rtl" style={{ background: '#0D1520' }}>

      {/* Logo */}
      <div className="px-6 py-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
          <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', boxShadow: '0 0 20px rgba(0,212,200,0.35)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-[19px] h-[19px]">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <path d="M3 9h18" /><path d="M8 2v4M16 2v4" strokeLinecap="round" />
              <path d="M8 13h2M14 13h2M8 17h2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[19px] font-black"
                style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Nobatic
          </span>
        </button>
      </div>

      {/* Card */}
      <div className="flex items-start justify-center px-4 pb-16">
        <div className="w-full max-w-md rounded-[20px] p-8"
             style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.07)' }}>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                 style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', boxShadow: '0 0 24px rgba(0,212,200,0.3)' }}>
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12 12 0 0 0 .66 2.65 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6.29 6.29l1.19-1.19a2 2 0 0 1 2.11-.45 12 12 0 0 0 2.65.66A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <h1 className="text-xl font-black mb-2" style={{ color: '#DCF0F5' }}>خوش آمدید</h1>
            <p className="text-sm leading-6" style={{ color: '#4A6E8A' }}>شماره موبایل خود را وارد کنید تا کد تأیید برایتان ارسال شود</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <label className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>شماره موبایل</label>
            <div className="flex items-center rounded-2xl px-4 py-3.5 mb-1 transition-all"
                 style={{ background: '#1A2A3E', border: '1px solid rgba(0,212,200,0.18)' }}
                 onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,200,0.45)'}
                 onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,200,0.18)'}>
              <svg className="w-5 h-5 ml-2 shrink-0" style={{ color: '#00D4C8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
              </svg>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.trim())}
                placeholder="09120000001"
                dir="ltr"
                className="bg-transparent outline-none text-sm w-full text-right font-semibold tracking-wide"
                style={{ color: '#DCF0F5' }}
                disabled={loading || isBlocked}
                autoFocus
                maxLength={11}
                autoComplete="tel"
              />
            </div>
            <p className="text-xs mb-5" style={{ color: '#4A6E8A' }}>مثال: ۰۹۱۲۳۴۵۶۷۸۹</p>

            {/* Rate-limit countdown */}
            {isBlocked && (
              <div className="flex items-center justify-between text-sm rounded-2xl px-4 py-3 mb-4"
                   style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  لطفاً {formatWait(countdown)} دیگر امتحان کنید
                </span>
                <span className="font-mono font-bold tabular-nums" dir="ltr">
                  {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Error */}
            {!isBlocked && error && (
              <div className="text-sm rounded-2xl px-4 py-3 mb-4"
                   style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!isValidPhone || isBlocked || loading}
              className="w-full text-white font-black py-4 rounded-2xl text-sm transition-all
                         flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
            >
              {loading ? <Spinner size="xs" light /> : (
                <>
                  دریافت کد تأیید
                  <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs mt-6 leading-6" style={{ color: '#4A6E8A' }}>
            با ادامه دادن، <Link to="/terms" style={{ color: '#00D4C8', fontWeight: 600 }}>قوانین و مقررات</Link> نوبتیک را می‌پذیرید
          </p>
        </div>
      </div>
    </div>
  )
}
