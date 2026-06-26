import { useState, useEffect, useRef } from 'react'
import OwnerLayout from '../../layouts/OwnerLayout'
import Button from '../../components/Button'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import { notify } from '../../utils/toast'
import { getMyBusiness, updateMyBusiness, getBusinessCategories } from '../../api/providers'
import ImageAvatar from '../../components/ImageAvatar'
import client from '../../api/client'

const LOGO_ACCEPT = '.jpg,.jpeg,.png,.webp'
const LOGO_MAX_SIZE = 2 * 1024 * 1024

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

  const [logoFile,       setLogoFile]       = useState(null)
  const [logoPreview,    setLogoPreview]    = useState(null)
  const [uploadingLogo,  setUploadingLogo]  = useState(false)
  const [logoError,      setLogoError]      = useState('')
  const logoInputRef = useRef(null)

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
    if (trimmedName.length < 2) { setFormError('نام کسب‌وکار باید حداقل ۲ کاراکتر باشد.'); return }
    setFormError('')
    setSaving(true)
    try {
      const updated = await updateMyBusiness({ name: trimmedName, category, description: description.trim(), phone: phone.trim(), address: address.trim() })
      setBusiness(updated)
      notify('اطلاعات کسب‌وکار بروزرسانی شد.', 'success')
    } catch (err) {
      const data = err?.response?.data
      setFormError(data?.name?.[0] || data?.phone?.[0] || data?.error || 'خطا در ذخیره اطلاعات.')
    } finally { setSaving(false) }
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
      setSlugError(data?.latin_slug?.[0] || data?.error || 'خطا در ذخیره آدرس.')
    } finally { setSavingSlug(false) }
  }

  function handleLogoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setLogoError('فقط فرمت‌های JPG، PNG و WebP مجاز است.'); return }
    if (file.size > LOGO_MAX_SIZE) { setLogoError('حجم فایل نباید بیشتر از ۲ مگابایت باشد.'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleLogoClear() {
    setLogoFile(null)
    setLogoError('')
    if (logoPreview) { URL.revokeObjectURL(logoPreview); setLogoPreview(null) }
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  async function handleLogoUpload() {
    if (!logoFile) return
    setUploadingLogo(true)
    setLogoError('')
    try {
      const fd = new FormData()
      fd.append('logo', logoFile)
      const { data } = await client.patch('/api/v1/businesses/me/', fd)
      setBusiness(data)
      handleLogoClear()
      notify('لوگو با موفقیت بروزرسانی شد.', 'success')
    } catch (err) {
      setLogoError(err?.response?.data?.logo?.[0] || err?.response?.data?.error || 'خطا در آپلود لوگو.')
    } finally { setUploadingLogo(false) }
  }

  const previewUrl = latinSlug ? `nobatiic.ir/book/${latinSlug}` : business?.slug ? `nobatiic.ir/book/${business.slug}` : ''
  const inputCls = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-colors"
  const inputBg = { background: '#111E2E', border: '1px solid rgba(0,212,200,0.18)', color: '#DCF0F5' }

  if (loading) {
    return <OwnerLayout title="تنظیمات"><div className="flex justify-center py-20"><Spinner /></div></OwnerLayout>
  }
  if (fetchError) {
    return <OwnerLayout title="تنظیمات"><ErrorMessage message={fetchError} /></OwnerLayout>
  }

  return (
    <OwnerLayout title="تنظیمات" subtitle="مدیریت اطلاعات و تنظیمات کسب‌وکار">
      <div className="max-w-3xl space-y-5">

        {/* Logo upload */}
        <div className="rounded-2xl p-5" style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}>
          <h2 className="text-sm font-bold mb-1" style={{ color: '#DCF0F5' }}>لوگوی کسب‌وکار</h2>
          <p className="text-xs mb-4" style={{ color: '#4A6E8A' }}>JPG، PNG یا WebP — حداکثر ۲ مگابایت</p>
          <div className="flex items-center gap-4">
            <ImageAvatar src={logoPreview || business?.logo} alt="لوگو" fallbackText={business?.name} size="w-20 h-20" shape="rounded-2xl" className="shadow-md" />
            <div className="flex flex-col gap-2">
              <input ref={logoInputRef} type="file" accept={LOGO_ACCEPT} onChange={handleLogoSelect} className="hidden" />
              {!logoFile ? (
                <button type="button" onClick={() => logoInputRef.current?.click()}
                        className="text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
                        style={{ background: 'transparent', color: '#00D4C8', border: '1px solid rgba(0,212,200,0.3)' }}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  {business?.logo ? 'تغییر لوگو' : 'انتخاب لوگو'}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button type="button" variant="primary" size="sm" loading={uploadingLogo} onClick={handleLogoUpload}>آپلود</Button>
                  <button type="button" onClick={handleLogoClear} disabled={uploadingLogo} className="text-xs transition-colors disabled:opacity-50" style={{ color: '#4A6E8A' }}>انصراف</button>
                </div>
              )}
              {logoFile && <p className="text-xs" style={{ color: '#4A6E8A' }}>{logoFile.name} — {(logoFile.size / 1024).toFixed(0)} KB</p>}
            </div>
          </div>
          {logoError && <p className="text-xs text-red-500 mt-2">{logoError}</p>}
        </div>

        {/* General info */}
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4" style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}>
          <h2 className="text-sm font-bold mb-2" style={{ color: '#DCF0F5' }}>اطلاعات کلی</h2>

          <div>
            <label htmlFor="settings-name" className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>نام کسب‌وکار <span className="text-red-400">*</span></label>
            <input id="settings-name" type="text" value={name} onChange={(e) => setName(e.target.value)} disabled={saving} className={inputCls} style={inputBg} onFocus={e => e.target.style.borderColor = 'rgba(0,212,200,0.45)'} onBlur={e => e.target.style.borderColor = 'rgba(0,212,200,0.18)'} />
          </div>

          <div>
            <label htmlFor="settings-category" className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>دسته‌بندی</label>
            <select id="settings-category" value={category} onChange={(e) => setCategory(e.target.value)} disabled={saving} className={inputCls} style={inputBg}>
              {categories.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="settings-description" className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>توضیحات</label>
            <textarea id="settings-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="معرفی کوتاه کسب‌وکار..." disabled={saving} className={`${inputCls} resize-none`} style={inputBg} onFocus={e => e.target.style.borderColor = 'rgba(0,212,200,0.45)'} onBlur={e => e.target.style.borderColor = 'rgba(0,212,200,0.18)'} />
          </div>

          <div>
            <label htmlFor="settings-phone" className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>شماره تماس</label>
            <input id="settings-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={saving} dir="ltr" className={`${inputCls} text-left`} style={inputBg} onFocus={e => e.target.style.borderColor = 'rgba(0,212,200,0.45)'} onBlur={e => e.target.style.borderColor = 'rgba(0,212,200,0.18)'} />
          </div>

          <div>
            <label htmlFor="settings-address" className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>آدرس</label>
            <input id="settings-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} disabled={saving} className={inputCls} style={inputBg} onFocus={e => e.target.style.borderColor = 'rgba(0,212,200,0.45)'} onBlur={e => e.target.style.borderColor = 'rgba(0,212,200,0.18)'} />
          </div>

          {formError && <div className="text-sm rounded-xl px-4 py-3" style={{ color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>{formError}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="submit" disabled={saving}
                    className="text-white text-sm font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}>
              {saving ? <Spinner size="xs" light /> : 'ذخیره تغییرات'}
            </button>
          </div>
        </form>

        {/* Latin slug */}
        <form onSubmit={handleSlugSubmit} className="rounded-2xl p-5 space-y-4" style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#DCF0F5' }}>آدرس اختصاصی</h2>
            <p className="text-xs mt-0.5" style={{ color: '#4A6E8A' }}>یک آدرس انگلیسی برای صفحه رزرو خود انتخاب کنید.</p>
          </div>

          <div>
            <label htmlFor="latin-slug" className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>آدرس اختصاصی کسب‌وکار</label>
            <input id="latin-slug" type="text" value={latinSlug} onChange={handleLatinSlugChange} placeholder="ariya-beauty" disabled={savingSlug} dir="ltr" autoComplete="off"
                   className={`${inputCls} text-left`} style={{ ...inputBg, ...(slugError ? { borderColor: 'rgba(239,68,68,0.5)' } : {}) }}
                   onFocus={e => e.target.style.borderColor = slugError ? 'rgba(239,68,68,0.5)' : 'rgba(0,212,200,0.45)'}
                   onBlur={e => e.target.style.borderColor = slugError ? 'rgba(239,68,68,0.5)' : 'rgba(0,212,200,0.18)'} />
            <p className="text-xs mt-1" style={{ color: '#4A6E8A' }}>فقط حروف انگلیسی کوچک، اعداد و خط‌فاصله مجاز است</p>
            {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
          </div>

          {previewUrl && (
            <div className="rounded-xl px-3 py-2" style={{ background: '#111E2E', border: '1px solid rgba(0,212,200,0.07)' }}>
              <p className="text-xs mb-0.5" style={{ color: '#4A6E8A' }}>پیش‌نمایش لینک:</p>
              <p className="text-sm font-mono" dir="ltr" style={{ color: '#DCF0F5' }}>{previewUrl}</p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" variant="primary" size="md" loading={savingSlug} disabled={!!slugError}>ذخیره آدرس</Button>
          </div>
        </form>

      </div>
    </OwnerLayout>
  )
}
