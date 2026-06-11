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
  const [description,       setDescription]       = useState('')
  const [phone,             setPhone]             = useState('')
  const [address,           setAddress]           = useState('')
  const [categories,        setCategories]        = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loading,           setLoading]           = useState(false)
  const [error,             setError]             = useState('')

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
      await createMyBusiness({
        name:        trimmedName,
        category,
        description: description.trim(),
        phone:       phone.trim(),
        address:     address.trim(),
      })

      const response = await getCurrentUser()
      setUser(response.data)

      navigate('/dashboard', { replace: true })
    } catch (err) {
      const data  = err?.response?.data
      const field = data?.name?.[0] || data?.category?.[0] || data?.phone?.[0]
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8" dir="rtl">
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

          <div>
            <label htmlFor="business-description" className="block text-sm font-medium text-gray-700 mb-1">
              توضیحات
            </label>
            <textarea
              id="business-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="معرفی کوتاه کسب‌وکار شما..."
              rows={3}
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                         disabled:bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="business-phone" className="block text-sm font-medium text-gray-700 mb-1">
              شماره تماس
            </label>
            <input
              id="business-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 02112345678"
              dir="ltr"
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                         disabled:bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="business-address" className="block text-sm font-medium text-gray-700 mb-1">
              آدرس
            </label>
            <input
              id="business-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="آدرس کسب‌وکار"
              disabled={loading}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent
                         disabled:bg-gray-50"
            />
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

        <p className="text-center text-sm text-gray-400">
          می‌خواهید نوبت بگیرید؟{' '}
          <button
            type="button"
            onClick={() => navigate('/providers')}
            className="text-cyan-600 hover:text-cyan-800 font-medium underline-offset-2 hover:underline"
          >
            مشاهده ارائه‌دهندگان
          </button>
        </p>

      </div>
    </div>
  )
}
