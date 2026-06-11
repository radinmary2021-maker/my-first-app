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
  const [accountType, setAccountType] = useState('customer')
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تکمیل پروفایل</h1>
          <p className="text-sm text-gray-500 mt-1">
            لطفاً اطلاعات خود را وارد کنید.
          </p>
          {user?.phone && (
            <p className="text-xs text-gray-400 mt-1 font-mono" dir="ltr">{user.phone}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="full-name" className="block text-sm font-medium text-gray-700 mb-1">
              نام و نام خانوادگی <span className="text-red-400">*</span>
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
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent disabled:bg-gray-50"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 mb-2">نوع حساب</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('customer')}
                className={`border rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  accountType === 'customer'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-cyan-300'
                }`}
              >
                <span className="block text-xl mb-1">🙋</span>
                مشتری
                <span className="block text-xs font-normal text-gray-400 mt-0.5">رزرو نوبت</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('owner')}
                className={`border rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  accountType === 'owner'
                    ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                    : 'border-gray-200 text-gray-600 hover:border-cyan-300'
                }`}
              >
                <span className="block text-xl mb-1">🏢</span>
                صاحب کسب‌وکار
                <span className="block text-xs font-normal text-gray-400 mt-0.5">مدیریت نوبت</span>
              </button>
            </div>
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
