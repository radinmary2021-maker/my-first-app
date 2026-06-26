import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { verifyOtp, sendOtp } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import Spinner from '../../components/Spinner'

const OTP_LENGTH     = 6
const RESEND_SECONDS = 120

function formatWait(s) {
  const m = Math.floor(s / 60), r = s % 60
  if (m === 0) return `${s} ثانیه`
  if (r === 0) return `${m} دقیقه`
  return `${m} دقیقه و ${r} ثانیه`
}

export default function VerifyOtpPage() {
  const navigate  = useNavigate()
  const { state } = useLocation()
  const login     = useAuthStore((s) => s.login)

  const [otp, setOtp]         = useState(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS)
  const [blockCountdown,  setBlockCountdown]  = useState(0)

  const inputRefs = useRef([])

  useEffect(() => {
    if (resendCountdown <= 0) return
    const id = setInterval(() => setResendCountdown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(id)
  }, [resendCountdown])

  useEffect(() => {
    if (blockCountdown <= 0) return
    const id = setInterval(() => setBlockCountdown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(id)
  }, [blockCountdown])

  if (!state?.phone) return <Navigate to="/login" replace />

  const phone     = state.phone
  const canResend = resendCountdown === 0 && blockCountdown === 0
  const code      = otp.join('')
  const isComplete = code.length === OTP_LENGTH

  async function submitOtp(fullCode) {
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { data } = await verifyOtp(phone, fullCode)
      login({ access: data.access, refresh: data.refresh, user: data.user })
      let destination
      if      (data.business)              destination = '/dashboard'
      else if (!data.user.full_name)       destination = '/setup-profile'
      else if (data.user.role === 'owner') destination = '/create-business'
      else                                 destination = '/providers'
      navigate(destination, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error
      setError(msg || 'کد وارد شده نادرست است.')
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  function handleBoxChange(index, value) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    const fullCode = next.join('')
    if (fullCode.length === OTP_LENGTH) {
      submitOtp(fullCode)
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasted) return
    const next = Array(OTP_LENGTH).fill('')
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setOtp(next)
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
    if (pasted.length === OTP_LENGTH) submitOtp(pasted)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!isComplete) return
    submitOtp(code)
  }

  async function handleResend() {
    setError('')
    try {
      await sendOtp(phone)
      setResendCountdown(RESEND_SECONDS)
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch (err) {
      if (err.response?.status === 429) {
        const s = err.response?.data?.retry_after_seconds ?? 60
        setBlockCountdown(s)
      }
      setError('ارسال مجدد ناموفق بود. کمی صبر کنید.')
    }
  }

  return (
    <div className="min-h-screen grid-bg" dir="rtl" style={{ background: '#070D14' }}>

      {/* Logo */}
      <div className="px-6 py-5">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
          <div className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', boxShadow: '0 0 20px rgba(0,212,200,0.35)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-[19px] h-[19px]">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <path d="M3 9h18" /><path d="M8 2v4M16 2v4" strokeLinecap="round" />
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
             style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}>

          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-xs font-semibold mb-6 transition-colors"
            style={{ color: '#4A6E8A' }}
          >
            <svg className="w-3.5 h-3.5 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
            تغییر شماره موبایل
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
                 style={{ background: 'rgba(0,212,200,0.08)', border: '1px solid rgba(0,212,200,0.15)' }}>
              <svg className="w-8 h-8" style={{ color: '#00D4C8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-xl font-black mb-2" style={{ color: '#DCF0F5' }}>کد تأیید را وارد کنید</h1>
            <p className="text-sm leading-6" style={{ color: '#4A6E8A' }}>
              کد {OTP_LENGTH} رقمی به شماره{' '}
              <span className="font-bold" style={{ color: '#DCF0F5' }} dir="ltr">{phone}</span>{' '}
              پیامک شد
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* OTP boxes */}
            <div className="flex justify-center gap-2.5 mb-2" dir="ltr" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleBoxChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  autoFocus={i === 0}
                  className="w-12 h-14 text-center text-2xl font-black rounded-2xl outline-none transition-all disabled:opacity-50"
                  style={{ background: '#111E2E', border: '1px solid rgba(0,212,200,0.18)', color: '#DCF0F5' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,200,0.45)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,200,0.18)'}
                />
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm rounded-2xl px-4 py-3 mb-4 mt-4 text-center"
                   style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444' }}>
                {error}
              </div>
            )}

            {/* Rate-limit block */}
            {blockCountdown > 0 && (
              <div className="flex items-center justify-between text-sm rounded-2xl px-4 py-3 mb-4 mt-4"
                   style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  لطفاً {formatWait(blockCountdown)} دیگر امتحان کنید
                </span>
                <span className="font-mono font-bold tabular-nums" dir="ltr">
                  {String(Math.floor(blockCountdown / 60)).padStart(2, '0')}:{String(blockCountdown % 60).padStart(2, '0')}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={!isComplete || loading}
              className="w-full text-white font-black py-4 rounded-2xl text-sm transition-all mt-4 flex items-center justify-center
                         disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
            >
              {loading ? <Spinner size="xs" light /> : 'تأیید و ورود'}
            </button>
          </form>

          {/* Resend */}
          <div className="flex items-center justify-center gap-2 text-sm mt-5">
            {resendCountdown > 0 ? (
              <>
                <span style={{ color: '#4A6E8A' }}>ارسال مجدد تا</span>
                <span className="font-mono font-bold tabular-nums" style={{ color: '#DCF0F5' }} dir="ltr">
                  {String(Math.floor(resendCountdown / 60)).padStart(2, '0')}:{String(resendCountdown % 60).padStart(2, '0')}
                </span>
              </>
            ) : (
              <>
                <span style={{ color: '#4A6E8A' }}>کد را دریافت نکردید؟</span>
                <button
                  onClick={handleResend}
                  disabled={!canResend}
                  className="font-bold transition-colors disabled:opacity-50"
                  style={{ color: '#00D4C8' }}
                >
                  ارسال مجدد
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
