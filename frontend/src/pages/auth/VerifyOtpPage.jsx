import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { verifyOtp, sendOtp } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import ErrorMessage from '../../components/ErrorMessage'

const OTP_LENGTH = 6
const RESEND_SECONDS = 120

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const login = useAuthStore((s) => s.login)

  // All hooks must be called unconditionally before any early return
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const inputRefs = useRef([])

  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(id)
  }, [countdown])

  // Early return AFTER all hooks
  if (!state?.phone) return <Navigate to="/login" replace />

  const phone = state.phone
  const otp = digits.join('')

  function handleDigitChange(index, value) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted.length === OTP_LENGTH) {
      setDigits(pasted.split(''))
      inputRefs.current[OTP_LENGTH - 1]?.focus()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (otp.length < OTP_LENGTH) return
    setError('')
    setLoading(true)

    try {
      const { data } = await verifyOtp(phone, otp)
      login({ access: data.access, refresh: data.refresh, user: data.user })
      const destination = data.user.full_name ? '/doctors' : '/setup-profile'
      navigate(destination, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error
      setError(msg || 'کد وارد شده نادرست است.')
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    try {
      await sendOtp(phone)
      setCountdown(RESEND_SECONDS)
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch {
      setError('ارسال مجدد ناموفق بود.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        <button
          onClick={() => navigate('/login')}
          className="text-blue-500 text-sm mb-6 flex items-center gap-1 hover:text-blue-700"
        >
          ← تغییر شماره
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">کد تأیید</h1>
        <p className="text-sm text-gray-500 mb-8">
          کد ۶ رقمی ارسال شده به{' '}
          <span className="font-mono text-gray-700" dir="ltr">{phone}</span>{' '}
          را وارد کنید
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 justify-center" dir="ltr" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => (inputRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-lg font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <ErrorMessage message={error} />

          <button
            type="submit"
            disabled={loading || otp.length < OTP_LENGTH}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'در حال بررسی...' : 'ورود'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          {countdown > 0 ? (
            <span>
              ارسال مجدد تا{' '}
              <span className="font-mono text-gray-700" dir="ltr">
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                {String(countdown % 60).padStart(2, '0')}
              </span>
            </span>
          ) : (
            <button
              onClick={handleResend}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ارسال مجدد کد
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
