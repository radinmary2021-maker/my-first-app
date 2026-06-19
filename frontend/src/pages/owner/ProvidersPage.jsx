import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OwnerLayout from '../../layouts/OwnerLayout'
import Button from '../../components/Button'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import { notify } from '../../utils/toast'
import { useAuthStore } from '../../store/authStore'
import {
  useBusinessProviders,
  useCreateBusinessProvider,
  useUpdateBusinessProvider,
  useDeactivateBusinessProvider,
} from '../../hooks/useBusinessProviders'

const COVER_GRADS = [
  'linear-gradient(135deg,#0891B2,#22D3EE)',
  'linear-gradient(135deg,#7C3AED,#A78BFA)',
  'linear-gradient(135deg,#DB2777,#F472B6)',
  'linear-gradient(135deg,#059669,#34D399)',
  'linear-gradient(135deg,#EA580C,#FB923C)',
]
const AVATAR_COLORS = [
  ['bg-cyan-100', 'text-cyan-700'],
  ['bg-purple-100', 'text-purple-700'],
  ['bg-pink-100', 'text-pink-700'],
  ['bg-emerald-100', 'text-emerald-700'],
  ['bg-amber-100', 'text-amber-700'],
]

function getInitials(name) {
  if (!name) return '؟'
  const p = name.trim().split(' ')
  return p.length >= 2 ? p[0][0] + p[1][0] : p[0].slice(0, 2)
}

export default function ProvidersPage() {
  const navigate  = useNavigate()
  const user      = useAuthStore((s) => s.user)
  const isOwner   = user?.role === 'owner'

  const [dialog,      setDialog]      = useState(null)
  const [soloLoading, setSoloLoading] = useState(false)

  const { data: providers, isLoading, isError, refetch } = useBusinessProviders()
  const { mutate: createMutate, isPending: creating }       = useCreateBusinessProvider()
  const { mutate: updateMutate, isPending: updating }       = useUpdateBusinessProvider()
  const { mutate: deactivateMutate, isPending: deactivating } = useDeactivateBusinessProvider()

  function handleAddMyself() {
    setSoloLoading(true)
    createMutate(
      { phone: user.phone, full_name: user.full_name },
      {
        onSuccess: () => { setSoloLoading(false); notify('شما به عنوان ارائه‌دهنده اضافه شدید.', 'success'); navigate('/dashboard/schedule') },
        onError: (err) => { setSoloLoading(false); notify(err?.response?.data?.phone?.[0] || err?.response?.data?.error || 'خطا در افزودن ارائه‌دهنده.', 'error') },
      }
    )
  }

  function handleDeactivate() {
    const { provider } = dialog
    deactivateMutate(provider.id, {
      onSuccess: () => { setDialog(null); notify(`${provider.full_name} غیرفعال شد.`, 'success') },
      onError: (err) => { setDialog(null); notify(err?.response?.data?.error || 'خطا در غیرفعال‌سازی.', 'error') },
    })
  }

  return (
    <OwnerLayout
      title="متخصصان"
      subtitle={providers ? `${providers.length} متخصص` : ''}
      headerAction={
        isOwner && (providers?.length ?? 0) > 0 && (
          <button onClick={() => setDialog({ type: 'add', provider: null })}
                  className="text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-cyan-200 flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            + افزودن ارائه‌دهنده
          </button>
        )
      }
    >
      {isLoading && <div className="flex justify-center py-20"><Spinner /></div>}
      {isError && (
        <div className="space-y-3">
          <ErrorMessage message="خطا در دریافت لیست ارائه‌دهندگان." />
          <button onClick={() => refetch()} className="text-sm text-cyan-600 hover:underline">تلاش مجدد</button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && providers?.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
          </div>
          <h2 className="text-base font-bold text-slate-800">هنوز ارائه‌دهنده‌ای ندارید</h2>
          <p className="text-sm text-slate-500">ارائه‌دهنده کسی است که مشتریان برای او نوبت می‌گیرند.</p>
          <p className="text-xs text-slate-400">مرحله بعد: افزودن خدمات و تنظیم ساعات کاری</p>
          {isOwner && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button variant="primary" loading={soloLoading} onClick={handleAddMyself}>
                افزودن خودم به عنوان ارائه‌دهنده
              </Button>
              <Button variant="secondary" onClick={() => setDialog({ type: 'add', provider: null })}>
                افزودن ارائه‌دهنده دیگر
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Provider cards */}
      {!isLoading && !isError && providers?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p, i) => {
            const grad = COVER_GRADS[i % COVER_GRADS.length]
            const [avatarBg, avatarText] = AVATAR_COLORS[i % AVATAR_COLORS.length]
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
                <div className="h-20 relative" style={{ background: grad }} />
                <div className="p-4 -mt-8">
                  <div className={`w-16 h-16 rounded-2xl ${avatarBg} border-4 border-white flex items-center justify-center text-lg font-bold ${avatarText} shadow-sm mb-3`}>
                    {getInitials(p.full_name)}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-0.5">{p.full_name || '—'}</h3>
                  <p className="text-xs text-slate-400 font-mono mb-0.5">{p.phone}</p>
                  {p.specialty && <p className="text-xs text-slate-500 mb-2">{p.specialty}</p>}
                  <div className="flex items-center justify-between text-xs mb-4">
                    <span className={`flex items-center gap-1 font-semibold ${p.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                      {p.is_active ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {isOwner && (
                      <>
                        <button onClick={() => setDialog({ type: 'edit', provider: p })}
                                className="flex-1 bg-cyan-50 text-cyan-700 text-xs font-bold py-2 rounded-lg border border-cyan-100 flex items-center justify-center gap-1 hover:bg-cyan-100 transition-colors">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                          ویرایش
                        </button>
                        {p.is_active ? (
                          <button onClick={() => setDialog({ type: 'deactivate', provider: p })} aria-label="غیرفعال‌سازی"
                                  className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:text-rose-500 hover:bg-rose-50 transition-colors">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                          </button>
                        ) : (
                          <button onClick={() => updateMutate({ providerId: p.id, data: { is_active: true } }, { onSuccess: () => notify(`${p.full_name} فعال شد.`, 'success'), onError: () => notify('خطا در فعال‌سازی.', 'error') })} aria-label="فعال‌سازی"
                                  className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Add new card */}
          {isOwner && (
            <button onClick={() => setDialog({ type: 'add', provider: null })}
                    className="border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 p-8 hover:border-cyan-300 hover:bg-cyan-50/30 transition-colors group min-h-[220px]">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 group-hover:bg-cyan-100 flex items-center justify-center transition-colors">
                <svg className="w-5 h-5 text-slate-400 group-hover:text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
              </div>
              <span className="text-xs font-bold text-slate-500 group-hover:text-cyan-700">افزودن متخصص جدید</span>
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(dialog?.type === 'add' || dialog?.type === 'edit') && (
        <ProviderFormModal
          title={dialog.type === 'add' ? 'افزودن ارائه‌دهنده' : 'ویرایش ارائه‌دهنده'}
          initialValues={dialog.provider || {}}
          editMode={dialog.type === 'edit'}
          onClose={() => setDialog(null)}
          mutate={dialog.type === 'edit'
            ? (data, handlers) => updateMutate({ providerId: dialog.provider.id, data }, handlers)
            : createMutate
          }
          onSuccess={() => { setDialog(null); notify(dialog.type === 'add' ? 'ارائه‌دهنده اضافه شد.' : 'اطلاعات بروزرسانی شد.', 'success') }}
          isPending={dialog.type === 'edit' ? updating : creating}
        />
      )}

      {/* Deactivate Dialog */}
      {dialog?.type === 'deactivate' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-label="غیرفعال‌سازی ارائه‌دهنده">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4" dir="rtl">
            <h2 className="text-base font-bold text-slate-800">غیرفعال‌سازی ارائه‌دهنده</h2>
            <p className="text-sm text-slate-500">آیا می‌خواهید <span className="font-semibold text-slate-700">{dialog.provider.full_name}</span> را غیرفعال کنید؟</p>
            <div className="flex gap-3">
              <Button variant="danger" fullWidth loading={deactivating} onClick={handleDeactivate}>غیرفعال کن</Button>
              <Button variant="ghost" fullWidth disabled={deactivating} onClick={() => setDialog(null)}>انصراف</Button>
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  )
}

function ProviderFormModal({ title, initialValues = {}, editMode = false, onClose, mutate, onSuccess, isPending }) {
  const [phone,     setPhone]     = useState(initialValues.phone     || '')
  const [fullName,  setFullName]  = useState(initialValues.full_name || '')
  const [specialty, setSpecialty] = useState(initialValues.specialty || '')
  const [bio,       setBio]       = useState(initialValues.bio       || '')
  const [errors,    setErrors]    = useState({})

  function validate() {
    if (editMode) return {}
    const errs = {}
    const trimPhone = phone.trim()
    const trimName  = fullName.trim()
    if (!trimPhone) errs.phone = 'شماره موبایل الزامی است.'
    else if (!/^09\d{9}$/.test(trimPhone)) errs.phone = 'فرمت شماره موبایل صحیح نیست.'
    if (!trimName) errs.full_name = 'نام الزامی است.'
    else if (trimName.length < 2) errs.full_name = 'نام باید حداقل ۲ کاراکتر باشد.'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    const payload = editMode
      ? { specialty: specialty.trim(), bio: bio.trim() }
      : { phone: phone.trim(), full_name: fullName.trim(), specialty: specialty.trim(), bio: bio.trim() }
    mutate(payload, {
      onSuccess: () => onSuccess?.(),
      onError: (err) => {
        const data = err?.response?.data
        const fieldErrors = {}
        if (data?.phone) fieldErrors.phone = Array.isArray(data.phone) ? data.phone[0] : data.phone
        if (data?.full_name) fieldErrors.full_name = Array.isArray(data.full_name) ? data.full_name[0] : data.full_name
        if (data?.error) fieldErrors.general = data.error
        if (Object.keys(fieldErrors).length === 0) fieldErrors.general = 'خطا در ذخیره اطلاعات.'
        setErrors(fieldErrors)
      },
    })
  }

  const inputCls = "w-full border-2 border-cyan-100 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:bg-white transition-colors"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5" dir="rtl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button type="button" onClick={onClose} aria-label="بستن" className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editMode && (
            <>
              <div>
                <label htmlFor="provider-phone" className="block text-xs font-bold text-slate-600 mb-2">شماره موبایل <span className="text-red-400">*</span></label>
                <input id="provider-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xxxxxxxxx" dir="ltr" className={`${inputCls} text-left`} style={{ background: '#F0FDFF' }} />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="provider-name" className="block text-xs font-bold text-slate-600 mb-2">نام کامل <span className="text-red-400">*</span></label>
                <input id="provider-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="نام و نام خانوادگی" className={inputCls} style={{ background: '#F0FDFF' }} />
                {errors.full_name && <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>}
              </div>
            </>
          )}
          <div>
            <label htmlFor="provider-specialty" className="block text-xs font-bold text-slate-600 mb-2">تخصص</label>
            <input id="provider-specialty" type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="مثال: آرایشگر، مربی" className={inputCls} style={{ background: '#F0FDFF' }} />
          </div>
          <div>
            <label htmlFor="provider-bio" className="block text-xs font-bold text-slate-600 mb-2">بیوگرافی</label>
            <textarea id="provider-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="معرفی کوتاه..." className={`${inputCls} resize-none`} style={{ background: '#F0FDFF' }} />
          </div>
          {errors.general && <ErrorMessage message={errors.general} />}
          <div className="flex gap-3 pt-1">
            <Button type="submit" variant="primary" fullWidth loading={isPending}>ذخیره</Button>
            <Button type="button" variant="ghost" fullWidth disabled={isPending} onClick={onClose}>انصراف</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
