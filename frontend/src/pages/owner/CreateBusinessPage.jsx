import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getCurrentUser } from '../../api/auth'
import { createMyBusiness, getBusinessCategories } from '../../api/providers'
import Button from '../../components/Button'
import Input from '../../components/Input'
import ErrorMessage from '../../components/ErrorMessage'
import Spinner from '../../components/Spinner'

const IS_DESKTOP = typeof window !== 'undefined' && window.innerWidth >= 768

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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-sm p-6 space-y-6">

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="bg-cyan-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0">۱</span>
          <span className="text-cyan-700 font-medium">ایجاد کسب‌وکار</span>
          <span className="text-gray-300">←</span>
          <span>افزودن ارائه‌دهنده</span>
          <span className="text-gray-300">←</span>
          <span>تنظیم برنامه</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-800">ایجاد کسب‌وکار</h1>
          <p className="text-sm text-gray-500 mt-1">
            اطلاعات کسب‌وکار خود را وارد کنید تا نوبت‌گیری آنلاین را شروع کنید.
          </p>
          {user?.full_name && (
            <p className="text-xs text-gray-400 mt-1">{user.full_name} — {user.phone}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <Input
            id="business-name"
            label={<>نام کسب‌وکار <span className="text-red-400">*</span></>}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: آرایشگاه بانو پارسا"
            autoFocus={IS_DESKTOP}
            autoComplete="organization"
            disabled={loading}
          />

          <div className="space-y-1.5">
            <label htmlFor="business-category" className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              دسته‌بندی <span className="text-red-400">*</span>
            </label>
            <select
              id="business-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="business-description" className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              توضیحات
            </label>
            <textarea
              id="business-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="معرفی کوتاه کسب‌وکار شما..."
              rows={3}
              disabled={loading}
              className="input resize-none"
            />
          </div>

          <Input
            id="business-phone"
            label="شماره تماس"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="مثال: 02112345678"
            disabled={loading}
            forceLtr
          />

          <Input
            id="business-address"
            label="آدرس"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="آدرس کسب‌وکار"
            disabled={loading}
          />

          <ErrorMessage message={error} />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading || !name.trim() || !category}
          >
            ایجاد کسب‌وکار
          </Button>
        </form>

        <p className="text-center text-sm text-gray-400">
          می‌خواهید نوبت بگیرید؟{' '}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/providers')}
            className="text-cyan-600 hover:text-cyan-800 font-medium"
          >
            مشاهده ارائه‌دهندگان
          </Button>
        </p>

      </div>
    </div>
  )
}
