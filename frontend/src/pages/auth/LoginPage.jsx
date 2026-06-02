import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendOtp } from '../../api/auth'
import ErrorMessage from '../../components/ErrorMessage'

export default function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      const msg = err.response?.data?.message || err.response?.data?.error
      if (err.response?.status === 429) {
        setError('درخواست‌های زیادی ارسال شده. لطفاً چند دقیقه صبر کنید.')
      } else {
        setError(msg || 'خطا در ارسال کد. لطفاً دوباره تلاش کنید.')
      }
    } finally {
      setLoading(false)
    }
  }

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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
              autoFocus
            />
          </div>

          <ErrorMessage message={error} />

          <button
            type="submit"
            disabled={loading || !phone}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'در حال ارسال...' : 'ارسال کد تأیید'}
          </button>
        </form>
      </div>
    </div>
  )
}
