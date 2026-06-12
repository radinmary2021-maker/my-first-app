import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { verifyOtp, sendOtp } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/Button'
import Input from '../../components/Input'
import ErrorMessage from '../../components/ErrorMessage'
import { ChevronRightIcon, ClockIcon } from '../../components/Icon'

const OTP_LENGTH     = 6    // matches backend: k=6 in _generate_otp_code() + serializer max_length=6
const RESEND_SECONDS = 120  // UX cooldown between sends

/** Seconds → Persian: 300→"۵ دقیقه", 90→"۱ دقیقه و ۳۰ ثانیه", 45→"۴۵ ثانیه" */
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

  // ── All hooks before any conditional return ────────────────────────────
  const [otp, setOtp]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  /**
   * Two SEPARATE countdown states — intentionally never share the same setter:
   *
   *   resendCountdown  — UX-driven cooldown (RESEND_SECONDS = 120s, fixed).
   *                      Starts after every successful OTP send. Prevents the
   *                      user from spamming the resend button client-side.
   *
   *   blockCountdown   — Server-driven rate-limit (retry_after_seconds from 429,
   *                      variable). Set only when the server rejects a resend
   *                      request. Surfaced as an amber warning banner.
   *
   * They can never both be > 0 simultaneously in practice (resend is disabled
   * while resendCountdown > 0, so blockCountdown can only be set from 0).
   * Keeping them separate makes intent clear and prevents accidental mixing.
   */
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS)
  const [blockCountdown,  setBlockCountdown]  = useState(0)

  const inputRef = useRef(null)

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

  // Guard: must arrive here via navigate('/verify-otp', { state: { phone } })
  if (!state?.phone) return <Navigate to="/login" replace />

  const phone      = state.phone
  const isComplete = otp.length === OTP_LENGTH
  const canResend  = resendCountdown === 0 && blockCountdown === 0

  // ── Core OTP verify (accepts code directly — avoids stale state read) ──
  async function submitOtp(code) {
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { data } = await verifyOtp(phone, code)
      login({ access: data.access, refresh: data.refresh, user: data.user })

      // Role-aware redirect — authStore and navigation logic unchanged
      let destination
      if      (data.business)              destination = '/dashboard'
      else if (!data.user.full_name)       destination = '/setup-profile'
      else if (data.user.role === 'owner') destination = '/create-business'
      else                                 destination = '/providers'

      navigate(destination, { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error
      setError(msg || 'کد وارد شده نادرست است.')
      setOtp('')
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  // Auto-submit when all OTP_LENGTH digits are entered
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
      setResendCountdown(RESEND_SECONDS)  // ← UX cooldown only
      // blockCountdown stays 0 (success — no rate-limit hit)
      setOtp('')
      inputRef.current?.focus()
    } catch (err) {
      if (err.response?.status === 429) {
        const s = err.response?.data?.retry_after_seconds ?? 60
        setBlockCountdown(s)             // ← server rate-limit only; never touches resendCountdown
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

        {/* ── Resend section ─────────────────────────────────────────── */}
        <div className="mt-5 space-y-2">

          {/* Server rate-limit banner — only shows when blockCountdown > 0 */}
          {blockCountdown > 0 && (
            <div
              className="flex items-center justify-between text-sm rounded-xl px-4 py-3"
              role="status"
              aria-live="polite"
              style={{
                background: 'var(--color-warning-bg)',
                color:      '#92400E',
                border:     '1px solid rgba(217,119,6,.2)',
              }}
            >
              <span className="flex items-center gap-2">
                <ClockIcon size={15} />
                لطفاً {formatWait(blockCountdown)} دیگر امتحان کنید
              </span>
              <span className="font-mono font-bold tabular-nums" dir="ltr">
                {String(Math.floor(blockCountdown / 60)).padStart(2, '0')}:
                {String(blockCountdown % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* UX resend cooldown or resend button */}
          <div className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {resendCountdown > 0 ? (
              <span className="flex items-center justify-center gap-1.5">
                <span>ارسال مجدد تا</span>
                <span
                  className="font-mono font-bold tabular-nums"
                  style={{ color: 'var(--color-text-primary)' }}
                  dir="ltr"
                >
                  {String(Math.floor(resendCountdown / 60)).padStart(2, '0')}:
                  {String(resendCountdown % 60).padStart(2, '0')}
                </span>
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                disabled={!canResend}
                onClick={handleResend}
              >
                ارسال مجدد کد
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
