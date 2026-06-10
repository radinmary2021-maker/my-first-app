import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '../../api/auth'
import { useAuthStore } from '../../store/authStore'
import ErrorMessage from '../../components/ErrorMessage'

export default function SetupProfilePage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)

  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      // Profile is now complete — move to business onboarding.
      // Customers who do not want to create a business can navigate away from there.
      navigate('/create-business', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.full_name?.[0] || err?.response?.data?.error
      setError(msg || 'خطا در ذخیره اطلاعات. دوباره تلاش کنید.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تکمیل پروفایل</h1>
          <p className="text-sm text-gray-500 mt-1">
            لطفاً نام خود را وارد کنید تا بتوانید از سیستم استفاده کنید.
          </p>
          {user?.phone && (
            <p className="text-xs text-gray-400 mt-1 font-mono" dir="ltr">{user.phone}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">
              نام و نام خانوادگی
            </label>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: علی رضایی"
              autoFocus
              autoComplete="name"
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          <ErrorMessage message={error} />

          <button
            type="submit"
            disabled={loading || !fullName.trim()}
            className="w-full bg-cyan-500 text-white py-3 rounded-lg text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'در حال ذخیره...' : 'ذخیره و ادامه'}
          </button>
        </form>
      </div>
    </div>
  )
}
