import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Button from '../../components/Button'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import Badge from '../../components/Badge'
import { UserIcon, CalendarIcon, CheckIcon } from '../../components/Icon'
import { notify } from '../../utils/toast'
import { useAuthStore } from '../../store/authStore'
import {
  useBusinessProviders,
  useCreateBusinessProvider,
  useUpdateBusinessProvider,
  useDeactivateBusinessProvider,
} from '../../hooks/useBusinessProviders'

// ── Main Page ─────────────────────────────────────────────────────────────────

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
        onSuccess: () => {
          setSoloLoading(false)
          notify('شما به عنوان ارائه‌دهنده اضافه شدید.', 'success')
          navigate('/dashboard/schedule')
        },
        onError: (err) => {
          setSoloLoading(false)
          const data = err?.response?.data
          const msg  = data?.phone?.[0] || data?.error || 'خطا در افزودن ارائه‌دهنده. دوباره تلاش کنید.'
          notify(msg, 'error')
        },
      }
    )
  }

  function handleDeactivate() {
    const { provider } = dialog
    deactivateMutate(provider.id, {
      onSuccess: () => {
        setDialog(null)
        notify(`${provider.full_name} غیرفعال شد.`, 'success')
      },
      onError: (err) => {
        setDialog(null)
        notify(err?.response?.data?.error || 'خطا در غیرفعال‌سازی.', 'error')
      },
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-3xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">ارائه‌دهندگان</h1>
            <p className="text-sm text-gray-500 mt-0.5">مدیریت ارائه‌دهندگان کسب‌وکار شما</p>
          </div>
          {isOwner && (providers?.length ?? 0) > 0 && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => setDialog({ type: 'add', provider: null })}
            >
              + افزودن ارائه‌دهنده
            </Button>
          )}
        </div>

        {isLoading && <Spinner className="py-20" />}

        {isError && (
          <div className="space-y-3">
            <ErrorMessage message="خطا در دریافت لیست ارائه‌دهندگان." />
            <button
              onClick={() => refetch()}
              className="text-sm text-cyan-600 hover:underline"
            >
              تلاش مجدد
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && providers?.length === 0 && (
          <div className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-8 space-y-5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="bg-green-100 text-green-700 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                <CheckIcon size={12} />
              </span>
              <span className="text-gray-400">ایجاد کسب‌وکار</span>
              <span className="text-gray-300">←</span>
              <span className="bg-cyan-500 text-white w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 text-[10px]">۲</span>
              <span className="text-cyan-700 font-medium">افزودن ارائه‌دهنده</span>
              <span className="text-gray-300">←</span>
              <span>تنظیم برنامه</span>
            </div>

            <div className="text-center space-y-3 pt-2">
              <div className="flex justify-center text-gray-300">
                <UserIcon size={48} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">هنوز ارائه‌دهنده‌ای ندارید</h2>
              <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
                ارائه‌دهنده کسی است که مشتریان برای او نوبت می‌گیرند.
                اگر خودتان نوبت می‌پذیرید، همین دکمه را بزنید.
              </p>

              {isOwner && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    loading={soloLoading}
                    onClick={handleAddMyself}
                  >
                    افزودن خودم به عنوان ارائه‌دهنده
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => setDialog({ type: 'add', provider: null })}
                  >
                    افزودن ارائه‌دهنده دیگر
                  </Button>
                </div>
              )}
              <p className="text-xs text-gray-400">
                مرحله بعد: افزودن خدمات و تنظیم ساعات کاری
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/schedule')}
              >
                برو به تنظیم برنامه
              </Button>
            </div>
          </div>
        )}

        {/* Provider list */}
        {!isLoading && !isError && providers?.length > 0 && (
          <div className="space-y-3">
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                isOwner={isOwner}
                onEdit={()       => setDialog({ type: 'edit',       provider: p })}
                onDeactivate={()  => setDialog({ type: 'deactivate', provider: p })}
                onReactivate={()  =>
                  updateMutate(
                    { providerId: p.id, data: { is_active: true } },
                    {
                      onSuccess: () => notify(`${p.full_name} فعال شد.`, 'success'),
                      onError:   () => notify('خطا در فعال‌سازی.', 'error'),
                    }
                  )
                }
                onSchedule={() => navigate(`/dashboard/schedule?provider_id=${p.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {dialog?.type === 'add' && (
        <ProviderFormModal
          title="افزودن ارائه‌دهنده"
          onClose={() => setDialog(null)}
          mutate={createMutate}
          onSuccess={() => {
            setDialog(null)
            notify('ارائه‌دهنده با موفقیت اضافه شد.', 'success')
          }}
          isPending={creating}
        />
      )}

      {/* Edit Modal */}
      {dialog?.type === 'edit' && (
        <ProviderFormModal
          title="ویرایش ارائه‌دهنده"
          initialValues={dialog.provider}
          editMode
          onClose={() => setDialog(null)}
          mutate={(data, handlers) =>
            updateMutate({ providerId: dialog.provider.id, data }, handlers)
          }
          onSuccess={() => {
            setDialog(null)
            notify('اطلاعات ارائه‌دهنده بروزرسانی شد.', 'success')
          }}
          isPending={updating}
        />
      )}

      {/* Deactivate Dialog */}
      {dialog?.type === 'deactivate' && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="غیرفعال‌سازی ارائه‌دهنده"
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4" dir="rtl">
            <h2 className="text-base font-bold text-gray-800">غیرفعال‌سازی ارائه‌دهنده</h2>
            <p className="text-sm text-gray-600">
              آیا می‌خواهید{' '}
              <span className="font-semibold">{dialog.provider.full_name}</span>{' '}
              را غیرفعال کنید؟ این عملیات قابل بازگشت است.
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                fullWidth
                loading={deactivating}
                onClick={handleDeactivate}
              >
                غیرفعال کن
              </Button>
              <Button
                variant="ghost"
                fullWidth
                disabled={deactivating}
                onClick={() => setDialog(null)}
              >
                انصراف
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

// ── ProviderCard ──────────────────────────────────────────────────────────────

function ProviderCard({ provider, isOwner, onEdit, onDeactivate, onReactivate, onSchedule }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-gray-800">{provider.full_name || '—'}</p>
            <Badge variant={provider.is_active ? 'success' : 'neutral'}>
              {provider.is_active ? 'فعال' : 'غیرفعال'}
            </Badge>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{provider.phone}</p>
          {provider.specialty && (
            <p className="text-sm text-gray-600 mt-1">{provider.specialty}</p>
          )}
        </div>

        {isOwner && (
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" onClick={onEdit}>ویرایش</Button>
            {provider.is_active ? (
              <Button variant="danger" size="sm" onClick={onDeactivate}>غیرفعال‌سازی</Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={onReactivate}>فعال‌سازی</Button>
            )}
          </div>
        )}
      </div>

      {isOwner && provider.is_active && (
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={onSchedule}
          className="border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 flex items-center gap-2 justify-center"
        >
          <CalendarIcon size={16} />
          تنظیم ساعات کاری
        </Button>
      )}
    </div>
  )
}

// ── ProviderFormModal ─────────────────────────────────────────────────────────

function ProviderFormModal({
  title,
  initialValues = {},
  editMode      = false,
  onClose,
  mutate,
  onSuccess,
  isPending,
}) {
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
    if (!trimPhone)                         errs.phone     = 'شماره موبایل الزامی است.'
    else if (!/^09\d{9}$/.test(trimPhone)) errs.phone     = 'فرمت شماره موبایل صحیح نیست. مثال: 09123456789'
    if (!trimName)                          errs.full_name = 'نام الزامی است.'
    else if (trimName.length < 2)           errs.full_name = 'نام باید حداقل ۲ کاراکتر باشد.'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    const payload = editMode
      ? { specialty: specialty.trim(), bio: bio.trim() }
      : {
          phone:     phone.trim(),
          full_name: fullName.trim(),
          specialty: specialty.trim(),
          bio:       bio.trim(),
        }

    mutate(payload, {
      onSuccess: () => onSuccess?.(),
      onError: (err) => {
        const data        = err?.response?.data
        const fieldErrors = {}
        if (data?.phone)     fieldErrors.phone     = Array.isArray(data.phone)     ? data.phone[0]     : data.phone
        if (data?.full_name) fieldErrors.full_name = Array.isArray(data.full_name) ? data.full_name[0] : data.full_name
        if (data?.error)     fieldErrors.general   = data.error
        if (Object.keys(fieldErrors).length === 0) {
          fieldErrors.general = 'خطا در ذخیره اطلاعات. دوباره تلاش کنید.'
        }
        setErrors(fieldErrors)
      },
    })
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5" dir="rtl">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!editMode && (
            <>
              <div>
                <label htmlFor="provider-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  شماره موبایل <span className="text-red-400">*</span>
                </label>
                <input
                  id="provider-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                  dir="ltr"
                  className="input"
                />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label htmlFor="provider-name" className="block text-sm font-medium text-gray-700 mb-1">
                  نام کامل <span className="text-red-400">*</span>
                </label>
                <input
                  id="provider-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="نام و نام خانوادگی"
                  className="input"
                />
                {errors.full_name && <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>}
              </div>
            </>
          )}

          <div>
            <label htmlFor="provider-specialty" className="block text-sm font-medium text-gray-700 mb-1">
              تخصص
            </label>
            <input
              id="provider-specialty"
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="مثال: آرایشگر، مربی، مشاور"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="provider-bio" className="block text-sm font-medium text-gray-700 mb-1">
              بیوگرافی
            </label>
            <textarea
              id="provider-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="معرفی کوتاه ارائه‌دهنده..."
              className="input resize-none"
            />
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
