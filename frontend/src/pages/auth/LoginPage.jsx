import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendOtp } from '../../api/auth'
import Button from '../../components/Button'
import Input from '../../components/Input'
import ErrorMessage from '../../components/ErrorMessage'
import { SmartphoneIcon, ClockIcon } from '../../components/Icon'

/** Convert seconds → readable Persian: 120→"۲ دقیقه", 90→"۱ دقیقه و ۳۰ ثانیه", 45→"۴۵ ثانیه" */
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

  // Tick the rate-limit countdown; clear error when it expires
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
        // error text is shown in the countdown banner, not ErrorMessage
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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-surface)' }}
      dir="rtl"
    >
      <div className="card w-full max-w-sm p-8">

        {/* Brand */}
        <p className="text-2xl font-black mb-8 tracking-tight" style={{ color: 'var(--color-brand)' }}>
          Nobatic
        </p>

        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          ورود / ثبت‌نام
        </h1>
        <p className="text-sm mb-7" style={{ color: 'var(--color-text-secondary)' }}>
          شماره موبایل خود را وارد کنید
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label="شماره موبایل"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.trim())}
            placeholder="09120000001"
            forceLtr
            iconStart={<SmartphoneIcon size={16} />}
            disabled={loading || isBlocked}
            autoFocus
            maxLength={11}
            autoComplete="tel"
          />

          {/* Rate-limit countdown banner */}
          {isBlocked && (
            <div
              className="flex items-center justify-between text-sm rounded-xl px-4 py-3"
              role="status"
              aria-live="polite"
              style={{
                background:  'var(--color-warning-bg)',
                color:       '#92400E',
                border:      '1px solid rgba(217,119,6,.2)',
              }}
            >
              <span className="flex items-center gap-2">
                <ClockIcon size={15} />
                لطفاً {formatWait(countdown)} دیگر امتحان کنید
              </span>
              <span className="font-mono font-bold tabular-nums" dir="ltr">
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:
                {String(countdown % 60).padStart(2, '0')}
              </span>
            </div>
          )}

          {/* General errors (not rate-limit) */}
          {!isBlocked && error && <ErrorMessage message={error} />}

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={loading}
            disabled={!isValidPhone || isBlocked}
          >
            ارسال کد تأیید
          </Button>
        </form>

      </div>
    </div>
  )
}
