import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { verifyOtp, sendOtp } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/Button'
import Input from '../../components/Input'
import ErrorMessage from '../../components/ErrorMessage'
import { ChevronRightIcon } from '../../components/Icon'

const OTP_LENGTH     = 6
const RESEND_SECONDS = 120

export default function VerifyOtpPage() {
  const navigate   = useNavigate()
  const { state }  = useLocation()
  const login      = useAuthStore((s) => s.login)

  // All hooks before any conditional return
  const [otp, setOtp]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const inputRef = useRef(null)

  useEffect(() => {
    if (countdown <= 0) return
    const id = setInterval(() => setCountdown((c) => (c <= 1 ? 0 : c - 1)), 1000)
    return () => clearInterval(id)
  }, [countdown])

  // Guard: must arrive here via navigate('/verify-otp', { state: { phone } })
  if (!state?.phone) return <Navigate to="/login" replace />

  const phone      = state.phone
  const isComplete = otp.length === OTP_LENGTH

  // ── Core submit logic (accepts code directly to avoid stale-state reads) ──
  async function submitOtp(code) {
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { data } = await verifyOtp(phone, code)
      login({ access: data.access, refresh: data.refresh, user: data.user })

      // Role-aware redirect — same logic as before, authStore untouched
      let destination
      if      (data.business)            destination = '/dashboard'
      else if (!data.user.full_name)     destination = '/setup-profile'
      else if (data.user.role === 'owner') destination = '/create-business'
      else                               destination = '/providers'

      navigate(destination, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error
      setError(msg || 'کد وارد شده نادرست است.')
      setOtp('')                       // clear input
      inputRef.current?.focus()        // return focus for immediate retry
    } finally {
      setLoading(false)
    }
  }

  // ── Input handler — auto-submits when all digits entered ──────────────────
  function handleChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH)
    setOtp(val)
    if (val.length === OTP_LENGTH) submitOtp(val)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!isComplete) return
    submitOtp(otp)
  }

  async function handleResend() {
    setError('')
    try {
      await sendOtp(phone)
      setCountdown(RESEND_SECONDS)
      setOtp('')
      inputRef.current?.focus()
    } catch (err) {
      if (err.response?.status === 429) {
        const s = err.response?.data?.retry_after_seconds ?? 60
        setCountdown(s)
      }
      setError('ارسال مجدد ناموفق بود. کمی صبر کنید.')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-surface)' }}
      dir="rtl"
    >
      <div className="card w-full max-w-sm p-8">

        {/* Back to login */}
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="mb-6 -mr-2"
          onClick={() => navigate('/login')}
        >
          <ChevronRightIcon size={16} />
          تغییر شماره
        </Button>

        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          کد تأیید
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--color-text-secondary)' }}>
          کد {OTP_LENGTH} رقمی ارسال شده به{' '}
          <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }} dir="ltr">
            {phone}
          </span>{' '}
          را وارد کنید
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Single input — forceLtr so digits stay LTR; tracking-widest for visual spacing */}
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={handleChange}
            placeholder="——————"
            forceLtr
            maxLength={OTP_LENGTH}
            disabled={loading}
            autoFocus
            autoComplete="one-time-code"
            className="text-center text-2xl py-4"
          />

          {error && <ErrorMessage message={error} />}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            disabled={!isComplete}
          >
            تأیید و ورود
          </Button>
        </form>

        {/* Resend section */}
        <div className="mt-5 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {countdown > 0 ? (
            <span className="flex items-center justify-center gap-1.5">
              <span>ارسال مجدد تا</span>
              <span
                className="font-mono font-bold tabular-nums"
                style={{ color: 'var(--color-text-primary)' }}
                dir="ltr"
              >
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                {String(countdown % 60).padStart(2, '0')}
              </span>
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleResend}
            >
              ارسال مجدد کد
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}
