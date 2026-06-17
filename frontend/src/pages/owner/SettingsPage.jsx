import { useState, useEffect } from 'react'
import MainLayout from '../../layouts/MainLayout'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import { notify } from '../../utils/toast'
import { getMyBusiness, updateMyBusiness, getBusinessCategories } from '../../api/providers'

const LATIN_SLUG_RE = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$|^[a-z0-9]{1,2}$/

function validateLatinSlug(value) {
  if (!value) return ''
  if (value.length < 3) return 'حداقل ۳ کاراکتر لازم است.'
  if (value.length > 80) return 'حداکثر ۸۰ کاراکتر مجاز است.'
  if (value.startsWith('-') || value.endsWith('-')) return 'نمی‌تواند با خط‌فاصله شروع یا تمام شود.'
  if (value.includes('--')) return 'دو خط‌فاصله متوالی مجاز نیست.'
  if (!LATIN_SLUG_RE.test(value)) return 'فقط حروف انگلیسی کوچک، اعداد و خط‌فاصله مجاز است.'
  return ''
}

export default function SettingsPage() {
  const [business,    setBusiness]    = useState(null)
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [savingSlug,  setSavingSlug]  = useState(false)
  const [fetchError,  setFetchError]  = useState('')
  const [formError,   setFormError]   = useState('')
  const [slugError,   setSlugError]   = useState('')

  const [name,        setName]        = useState('')
  const [category,    setCategory]    = useState('')
  const [description, setDescription] = useState('')
  const [phone,       setPhone]       = useState('')
  const [address,     setAddress]     = useState('')
  const [latinSlug,   setLatinSlug]   = useState('')

  useEffect(() => {
    Promise.all([getMyBusiness(), getBusinessCategories()])
      .then(([biz, cats]) => {
        setBusiness(biz)
        setCategories(cats)
        setName(biz.name || '')
        setCategory(biz.category || '')
        setDescription(biz.description || '')
        setPhone(biz.phone || '')
        setAddress(biz.address || '')
        setLatinSlug(biz.latin_slug || '')
      })
      .catch(() => setFetchError('خطا در دریافت اطلاعات کسب‌وکار.'))
      .finally(() => setLoading(false))
  }, [])

  function handleLatinSlugChange(e) {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setLatinSlug(val)
    setSlugError(validateLatinSlug(val))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmedName = name.trim()
    if (trimmedName.length < 2) {
      setFormError('نام کسب‌وکار باید حداقل ۲ کاراکتر باشد.')
      return
    }
    setFormError('')
    setSaving(true)
    try {
      const updated = await updateMyBusiness({
        name:        trimmedName,
        category,
        description: description.trim(),
        phone:       phone.trim(),
        address:     address.trim(),
      })
      setBusiness(updated)
      notify('اطلاعات کسب‌وکار بروزرسانی شد.', 'success')
    } catch (err) {
      const data = err?.response?.data
      const msg  = data?.name?.[0] || data?.phone?.[0] || data?.error || 'خطا در ذخیره اطلاعات.'
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleSlugSubmit(e) {
    e.preventDefault()
    const err = validateLatinSlug(latinSlug)
    if (err && latinSlug) { setSlugError(err); return }
    setSlugError('')
    setSavingSlug(true)
    try {
      const updated = await updateMyBusiness({ latin_slug: latinSlug || null })
      setBusiness(updated)
      setLatinSlug(updated.latin_slug || '')
      notify('آدرس اختصاصی ذخیره شد.', 'success')
    } catch (err) {
      const data = err?.response?.data
      const msg  = data?.latin_slug?.[0] || data?.error || 'خطا در ذخیره آدرس.'
      setSlugError(msg)
    } finally {
      setSavingSlug(false)
    }
  }

  const previewUrl = latinSlug
    ? `nobatiic.ir/book/${latinSlug}`
    : business?.slug
    ? `nobatiic.ir/book/${business.slug}`
    : ''

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-20"><Spinner /></div>
      </MainLayout>
    )
  }

  if (fetchError) {
    return (
      <MainLayout>
        <div className="max-w-xl">
          <ErrorMessage message={fetchError} />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-xl space-y-6" dir="rtl">
        <div>
          <h1 className="text-xl font-bold text-gray-800">تنظیمات کسب‌وکار</h1>
          <p className="text-sm text-gray-500 mt-0.5">اطلاعات عمومی کسب‌وکار خود را ویرایش کنید.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">

          <Input
            id="settings-name"
            label={<>نام کسب‌وکار <span className="text-red-400">*</span></>}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />

          <div className="space-y-1.5">
            <label htmlFor="settings-category" className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              دسته‌بندی
            </label>
            <select
              id="settings-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={saving}
              className="input"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-description" className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              توضیحات
            </label>
            <textarea
              id="settings-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="معرفی کوتاه کسب‌وکار..."
              disabled={saving}
              className="input resize-none"
            />
          </div>

          <Input
            id="settings-phone"
            label="شماره تماس"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={saving}
            forceLtr
          />

          <Input
            id="settings-address"
            label="آدرس"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={saving}
          />

          <ErrorMessage message={formError} />

          <div className="flex items-center justify-between pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={saving}
              className="ml-auto"
            >
              ذخیره تغییرات
            </Button>
          </div>

        </form>

        {/* آدرس اختصاصی */}
        <form onSubmit={handleSlugSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">آدرس اختصاصی</h2>
            <p className="text-xs text-gray-500 mt-0.5">یک آدرس انگلیسی برای صفحه رزرو خود انتخاب کنید.</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="latin-slug" className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              آدرس اختصاصی کسب‌وکار
            </label>
            <input
              id="latin-slug"
              type="text"
              value={latinSlug}
              onChange={handleLatinSlugChange}
              placeholder="ariya-beauty"
              disabled={savingSlug}
              dir="ltr"
              className={`input text-left ${slugError ? 'border-red-400' : ''}`}
              autoComplete="off"
            />
            <p className="text-xs text-gray-400">فقط حروف انگلیسی کوچک، اعداد و خط‌فاصله مجاز است</p>
            {slugError && <p className="text-xs text-red-500">{slugError}</p>}
          </div>

          {previewUrl && (
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-500 mb-0.5">پیش‌نمایش لینک:</p>
              <p className="text-sm font-mono text-gray-700" dir="ltr">{previewUrl}</p>
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={savingSlug}
              disabled={!!slugError}
            >
              ذخیره آدرس
            </Button>
          </div>
        </form>

      </div>
    </MainLayout>
  )
}
