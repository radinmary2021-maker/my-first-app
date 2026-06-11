import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendOtp } from '../../api/auth'
import ErrorMessage from '../../components/ErrorMessage'

export default function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (countdown <= 0) return
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current)
          setError('')
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [countdown])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!/^09\d{9}$/.test(phone)) {
      setError('شماره موبایل معتبر وارد کنید (مثال: 09120000001)')
      return
    }

    setLoading(true)
    try {
      await sendOtp(phone)
      navigate('/verify-otp', { state: { phone } })
    } catch (err) {
      if (err.response?.status === 429) {
        const seconds = err.response?.data?.retry_after_seconds || 60
        setCountdown(seconds)
        setError(`لطفاً ${seconds} ثانیه صبر کنید و دوباره امتحان کنید`)
      } else {
        const msg = err.response?.data?.message || err.response?.data?.error
        setError(msg || 'خطا در ارسال کد. لطفاً دوباره تلاش کنید.')
      }
    } finally {
      setLoading(false)
    }
  }

  const isBlocked = countdown > 0

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">ورود به سیستم</h1>
        <p className="text-sm text-gray-500 mb-8">شماره موبایل خود را وارد کنید</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              شماره موبایل
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.trim())}
              placeholder="09120000001"
              dir="ltr"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              disabled={loading || isBlocked}
              autoFocus
            />
          </div>

          {error && (
            <div className={`text-sm rounded-lg px-3 py-2 ${
              isBlocked
                ? 'bg-amber-50 border border-amber-200 text-amber-700'
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              {isBlocked ? (
                <span>
                  لطفاً{' '}
                  <span className="font-bold font-mono">{countdown}</span>
                  {' '}ثانیه صبر کنید
                </span>
              ) : (
                error
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !phone || isBlocked}
            className="w-full bg-cyan-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'در حال ارسال...' : isBlocked ? `صبر کنید (${countdown}ث)` : 'ارسال کد تأیید'}
          </button>
        </form>
      </div>
    </div>
  )
}
