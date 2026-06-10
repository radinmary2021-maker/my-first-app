/**
 * pages/owner/CreateBusinessPage.jsx
 *
 * Self-service business creation for new owners.
 *
 * Role-staleness fix:
 *   After POST /api/v1/businesses/, the backend elevates the user's DB role
 *   from 'customer' → 'owner', but the JWT in the auth store is stale.
 *   We call getCurrentUser() immediately after creation and update the store
 *   with setUser() so DoctorRoute sees the correct role without a page refresh.
 *
 * Flow:
 *   1. Render form (name + category)
 *   2. POST /api/v1/businesses/
 *   3. GET  /api/auth/me/  → fresh user object with role='owner'
 *   4. setUser(freshUser)  → auth store updated
 *   5. navigate('/dashboard')  → DoctorRoute now passes
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getCurrentUser } from '../../api/auth'
import { createMyBusiness, getBusinessCategories } from '../../api/providers'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'

export default function CreateBusinessPage() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const setUser   = useAuthStore((s) => s.setUser)

  const [name,              setName]              = useState('')
  const [category,          setCategory]          = useState('')
  const [categories,        setCategories]        = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loading,           setLoading]           = useState(false)
  const [error,             setError]             = useState('')

  // Load the category list once on mount
  useEffect(() => {
    getBusinessCategories()
      .then((data) => {
        setCategories(data)
        if (data.length > 0) setCategory(data[0].value)
      })
      .catch(() => setError('خطا در دریافت دسته‌بندی‌ها. لطفاً صفحه را رفرش کنید.'))
      .finally(() => setLoadingCategories(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()

    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setError('نام کسب‌وکار باید حداقل ۲ کاراکتر باشد.')
      return
    }
    if (!category) {
      setError('لطفاً دسته‌بندی را انتخاب کنید.')
      return
    }

    setError('')
    setLoading(true)

    try {
      // 1. Create the business
      await createMyBusiness({ name: trimmedName, category })

      // 2. Refresh the user object — backend has elevated role to 'owner'
      //    This is the key step that fixes role staleness.
      const response   = await getCurrentUser()
      setUser(response.data)

      // 3. Navigate to dashboard — DoctorRoute now sees role='owner'
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const data  = err?.response?.data
      const field = data?.name?.[0] || data?.category?.[0]
      const msg   = field || data?.error || 'خطا در ایجاد کسب‌وکار. دوباره تلاش کنید.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (loadingCategories) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-8 space-y-6">

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="bg-cyan-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0">۱</span>
          <span className="text-cyan-700 font-medium">ایجاد کسب‌وکار</span>
          <span className="text-gray-300">←</span>
          <span>افزودن ارائه‌دهنده</span>
          <span className="text-gray-300">←</span>
          <span>تنظیم برنامه</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ایجاد کسب‌وکار</h1>
          <p className="text-sm text-gray-500 mt-1">
            اطلاعات کسب‌وکار خود را وارد کنید تا نوبت‌گیری آنلاین را شروع کنید.
          </p>
          {user?.full_name && (
            <p className="text-xs text-gray-400 mt-1">{user.full_name} — {user.phone}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label htmlFor="business-name" className="block text-sm font-medium text-gray-700 mb-1">
              نام کسب‌وکار <span className="text-red-400">*</span>
            </label>
            <input
              id="business-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: آرایشگاه بانو پارسا"
              autoFocus
              autoComplete="organization"
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                         disabled:bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="business-category" className="block text-sm font-medium text-gray-700 mb-1">
              دسته‌بندی <span className="text-red-400">*</span>
            </label>
            <select
              id="business-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                         disabled:bg-gray-50"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <ErrorMessage message={error} />

          <button
            type="submit"
            disabled={loading || !name.trim() || !category}
            className="w-full bg-cyan-500 text-white py-3 rounded-lg text-sm font-medium
                       hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors"
          >
            {loading ? 'در حال ایجاد...' : 'ایجاد کسب‌وکار'}
          </button>
        </form>

        {/* Escape hatch for customers who ended up here by accident */}
        <p className="text-center text-sm text-gray-400">
          می‌خواهید نوبت بگیرید؟{' '}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-cyan-600 hover:text-cyan-800 font-medium underline-offset-2 hover:underline"
          >
            بازگشت به صفحه اصلی
          </button>
        </p>

      </div>
    </div>
  )
}
