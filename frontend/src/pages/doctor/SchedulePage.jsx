import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import OwnerLayout from '../../layouts/OwnerLayout'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import { CalendarCheckIcon, CalendarXIcon, ChevronRightIcon } from '../../components/Icon'
import { notify } from '../../utils/toast'
import { toJalali } from '../../utils/jalali'
import {
  useMyWorkingHours,
  useBulkUpdateWorkingHours,
  useMyTimeOffs,
  useCreateTimeOff,
  useDeleteTimeOff,
  useMyServicesList,
  useCreateService,
  useUpdateService,
  useDeleteService,
} from '../../hooks/useDoctorSchedule'
import { useBusinessProviders } from '../../hooks/useBusinessProviders'

const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']

function extractError(err, fallback) {
  const data = err?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  return Object.values(data).flat().join(' — ') || fallback
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeader({ step, children, isDone }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        isDone ? 'bg-green-100 text-green-700' : 'bg-cyan-100 text-cyan-700'
      }`}>
        {isDone ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : step}
      </span>
      <h2 className="text-base font-semibold text-gray-700">{children}</h2>
    </div>
  )
}

function Card({ children }) {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 gap-3">
      {children}
    </div>
  )
}

function DeleteButton({ onClick, disabled, label = 'حذف' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 shrink-0 px-2 py-1 rounded hover:bg-red-50 transition-colors"
    >
      حذف
    </button>
  )
}

const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white'

// ── Services section ──────────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', duration_minutes: '30', buffer_minutes: '0', price: '0', description: '', provider: '' }

function serviceToForm(svc) {
  return {
    name:             svc.name,
    duration_minutes: String(svc.duration_minutes ?? 30),
    buffer_minutes:   String(svc.buffer_minutes   ?? 0),
    price:            String(svc.price            ?? 0),
    description:      svc.description             ?? '',
  }
}

function ServicesSection() {
  const [showInactive, setShowInactive] = useState(false)

  const { data: services, isLoading, isError, refetch } = useMyServicesList(showInactive)
  const { data: providers } = useBusinessProviders()
  const hasMultipleProviders = (providers?.length ?? 0) > 1
  const { mutate: addService,  isPending: adding  } = useCreateService()
  const { mutate: saveService, isPending: saving  } = useUpdateService()
  const { mutate: removeService                   } = useDeleteService()

  const [form, setForm]             = useState(EMPTY_FORM)
  const [editingId, setEditingId]   = useState(null)
  const [editForm, setEditForm]     = useState(EMPTY_FORM)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  function handleReactivate(id) {
    saveService(
      { id, data: { is_active: true } },
      {
        onSuccess: () => notify('خدمت مجدداً فعال شد.', 'success'),
        onError: (err) => notify(extractError(err, 'خطا در فعال‌سازی خدمت.'), 'error'),
      }
    )
  }

  function startEdit(svc) {
    setEditingId(svc.id)
    setEditForm(serviceToForm(svc))
  }

  function cancelEdit() { setEditingId(null) }

  function handleAdd(e) {
    e.preventDefault()
    addService(
      {
        name:             form.name.trim(),
        duration_minutes: parseInt(form.duration_minutes),
        buffer_minutes:   parseInt(form.buffer_minutes),
        price:            parseInt(form.price),
        description:      form.description.trim(),
      },
      {
        onSuccess: () => {
          notify('خدمت با موفقیت اضافه شد.', 'success')
          setForm(EMPTY_FORM)
        },
        onError: (err) => notify(extractError(err, 'خطا در ذخیره خدمت. دوباره تلاش کنید.'), 'error'),
      }
    )
  }

  function handleUpdate(e) {
    e.preventDefault()
    saveService(
      {
        id: editingId,
        data: {
          name:             editForm.name.trim(),
          duration_minutes: parseInt(editForm.duration_minutes),
          buffer_minutes:   parseInt(editForm.buffer_minutes),
          price:            parseInt(editForm.price),
          description:      editForm.description.trim(),
        },
      },
      {
        onSuccess: () => {
          notify('خدمت با موفقیت ویرایش شد.', 'success')
          setEditingId(null)
        },
        onError: (err) => notify(extractError(err, 'خطا در ذخیره تغییرات. دوباره تلاش کنید.'), 'error'),
      }
    )
  }

  function handleDeleteConfirmed() {
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    removeService(id, {
      onSuccess: () => notify('خدمت غیرفعال شد.', 'success'),
      onError: (err) => {
        const msg = String(err?.response?.data?.error || err?.response?.data?.detail || '')
        if (msg.toLowerCase().includes('appointment') || msg.includes('نوبت')) {
          notify('این سرویس دارای نوبت‌های فعال است و قابل حذف نیست — می‌توانید آن را غیرفعال کنید', 'error')
        } else {
          notify(extractError(err, 'خطا در حذف خدمت. دوباره تلاش کنید.'), 'error')
        }
      },
    })
  }

  const activeSvcs  = services?.filter(s => s.is_active) ?? []
  const hasSvcs     = activeSvcs.length > 0
  const inactiveCnt = showInactive ? (services?.filter(s => !s.is_active).length ?? 0) : 0

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader step="۱" isDone={hasSvcs}>خدمات</SectionHeader>
        {!isLoading && !isError && (
          <button
            onClick={() => { setShowInactive(p => !p); setEditingId(null) }}
            className="text-xs text-gray-400 hover:text-gray-600 underline-offset-2 hover:underline transition-colors"
          >
            {showInactive ? 'پنهان کردن غیرفعال‌ها' : 'نمایش غیرفعال‌ها'}
          </button>
        )}
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <div className="space-y-2">
          <ErrorMessage message="مشکلی در دریافت خدمات پیش آمد." />
          <button onClick={() => refetch()} className="text-sm text-cyan-600 hover:underline">تلاش مجدد</button>
        </div>
      )}

      {!isLoading && !isError && !hasSvcs && (
        <div className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
          {showInactive && inactiveCnt > 0
            ? 'همه خدمات غیرفعال هستند. برای بازگشت به حالت فعال، روی «فعال‌سازی مجدد» کلیک کنید.'
            : 'هیچ خدمتی ثبت نشده. اولین خدمت خود را از فرم زیر اضافه کنید.'}
        </div>
      )}

      {services?.map((svc) =>
        !svc.is_active ? (
          /* ── Inactive service row ── */
          <div key={svc.id} className="opacity-60">
            <Card>
              <div className="flex items-center gap-3 text-sm flex-1 min-w-0 flex-wrap">
                <span className="font-medium text-gray-800 truncate">{svc.name}</span>
                <span className="text-gray-500 text-xs">{svc.duration_minutes} دقیقه</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">غیرفعال</span>
              </div>
              <button
                onClick={() => handleReactivate(svc.id)}
                disabled={saving}
                className="text-xs text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded hover:bg-emerald-50 transition-colors shrink-0 disabled:opacity-50 whitespace-nowrap"
              >
                فعال‌سازی مجدد
              </button>
            </Card>
          </div>
        ) : editingId === svc.id ? (
          /* ── Inline edit form ── */
          <form
            key={svc.id}
            onSubmit={handleUpdate}
            className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 space-y-3"
          >
            <p className="text-sm font-medium text-cyan-700">ویرایش خدمت</p>
            <div>
              <label className="text-xs text-gray-500 block mb-1">نام خدمت <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                className={inputCls}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">مدت (دقیقه)</label>
                <input type="number" inputMode="numeric" min="5" required
                  value={editForm.duration_minutes}
                  onChange={(e) => setEditForm((p) => ({ ...p, duration_minutes: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">فاصله بعد از نوبت (دقیقه)</label>
                <input type="number" inputMode="numeric" min="0"
                  value={editForm.buffer_minutes}
                  onChange={(e) => setEditForm((p) => ({ ...p, buffer_minutes: e.target.value }))}
                  className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">قیمت (تومان)</label>
                <input type="number" inputMode="numeric" min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                  className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">توضیحات (اختیاری)</label>
              <input type="text"
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="توضیح کوتاه برای مشتریان"
                className={inputCls} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" variant="primary" loading={saving} disabled={saving || !editForm.name.trim()}>
                ذخیره تغییرات
              </Button>
              <Button type="button" variant="ghost" onClick={cancelEdit} disabled={saving}>
                انصراف
              </Button>
            </div>
          </form>
        ) : (
          /* ── Normal card row ── */
          <Card key={svc.id}>
            <div className="flex items-center gap-3 text-sm flex-1 min-w-0 flex-wrap">
              <span className="font-medium text-gray-800 truncate">{svc.name}</span>
              <span className="text-gray-500 text-xs">{svc.duration_minutes} دقیقه</span>
              {svc.buffer_minutes > 0 && (
                <span className="text-xs text-gray-400">+{svc.buffer_minutes}د فاصله</span>
              )}
              {Number(svc.price) > 0 && (
                <span className="text-xs text-emerald-700 font-medium">
                  {Number(svc.price).toLocaleString('fa-IR')} تومان
                </span>
              )}
              {!svc.is_active && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">غیرفعال</span>}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => startEdit(svc)}
                className="text-xs text-cyan-500 hover:text-cyan-700 px-2 py-1 rounded hover:bg-cyan-50 transition-colors"
              >
                ویرایش
              </button>
              <DeleteButton
                label={`حذف خدمت ${svc.name}`}
                onClick={() => setConfirmDeleteId(svc.id)}
              />
            </div>
          </Card>
        )
      )}

      {/* ── Delete confirm dialog ── */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-svc-title"
        >
          <div className="card p-6 w-full max-w-sm space-y-4" dir="rtl">
            <h2 id="delete-svc-title" className="text-base font-bold text-gray-800">حذف خدمت</h2>
            <p className="text-sm text-gray-500">
              آیا مطمئن هستید؟ این خدمت غیرفعال می‌شود و برای مشتریان جدید قابل رزرو نخواهد بود.
            </p>
            <p className="text-xs text-gray-400">
              داده از بین نمی‌رود — در صورت نیاز از طریق پنل مدیریت قابل بازگشت است.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" fullWidth onClick={handleDeleteConfirmed}>
                بله، حذف کن
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setConfirmDeleteId(null)}>
                انصراف
              </Button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">افزودن خدمت جدید</p>
        <div>
          <label className="text-xs text-gray-500 block mb-1">نام خدمت <span className="text-red-400">*</span></label>
          <input
            type="text"
            required
            placeholder="مثلاً: ویزیت، کوتاهی مو، مشاوره"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">مدت (دقیقه)</label>
            <input type="number" inputMode="numeric" min="5" required value={form.duration_minutes}
              onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">فاصله بعد از نوبت (دقیقه)</label>
            <input type="number" inputMode="numeric" min="0" value={form.buffer_minutes}
              onChange={(e) => setForm((p) => ({ ...p, buffer_minutes: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">قیمت (تومان)</label>
            <input type="number" inputMode="numeric" min="0" value={form.price}
              onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
              className={inputCls} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">توضیحات (اختیاری)</label>
          <input type="text" value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="توضیح کوتاه برای مشتریان"
            className={inputCls} />
        </div>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={adding}
          disabled={adding || !form.name.trim()}
        >
          افزودن خدمت
        </Button>
      </form>
    </section>
  )
}

// ── Working hours section ─────────────────────────────────────────────────────

const DEFAULT_START = '08:00'
const DEFAULT_END   = '20:00'

function makeWeekState(hours) {
  return WEEKDAYS.map((_, i) => {
    const h = hours?.find((x) => x.weekday === i)
    return {
      weekday:    i,
      enabled:    !!h && h.is_active !== false,
      start_time: h?.start_time?.slice(0, 5) || DEFAULT_START,
      end_time:   h?.end_time?.slice(0, 5)   || DEFAULT_END,
    }
  })
}

function WorkingHoursSection({ providerId }) {
  const { data: hours, isLoading, isError, refetch } = useMyWorkingHours(providerId)
  const { mutate: bulkSave, isPending: saving } = useBulkUpdateWorkingHours()

  const [week, setWeek] = useState(() => makeWeekState(null))
  const [masterStart, setMasterStart] = useState(DEFAULT_START)
  const [masterEnd,   setMasterEnd]   = useState(DEFAULT_END)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (hours !== undefined) {
      setWeek(makeWeekState(hours))
      setDirty(false)
    }
  }, [hours])

  function updateDay(i, patch) {
    setWeek((prev) => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d))
    setDirty(true)
  }

  function toggleAll(enabled) {
    setWeek((prev) => prev.map((d) => ({ ...d, enabled })))
    setDirty(true)
  }

  function applyMasterTime() {
    if (!masterStart || !masterEnd) return
    if (masterStart >= masterEnd) {
      notify('ساعت شروع باید قبل از ساعت پایان باشد.', 'error')
      return
    }
    setWeek((prev) => prev.map((d) => ({ ...d, start_time: masterStart, end_time: masterEnd })))
    setDirty(true)
  }

  function handleSave() {
    for (const d of week) {
      if (d.enabled && (!d.start_time || !d.end_time)) {
        notify(`ساعت ${WEEKDAYS[d.weekday]} را کامل کنید.`, 'error')
        return
      }
      if (d.enabled && d.start_time >= d.end_time) {
        notify(`ساعت شروع ${WEEKDAYS[d.weekday]} باید قبل از ساعت پایان باشد.`, 'error')
        return
      }
    }
    const pid = providerId ? parseInt(providerId) : null
    bulkSave(
      {
        hours: week.map((d) => ({
          weekday:    d.weekday,
          start_time: d.start_time || DEFAULT_START,
          end_time:   d.end_time   || DEFAULT_END,
          is_active:  d.enabled,
          provider:   pid,
        })),
        providerId: pid ?? undefined,
      },
      {
        onSuccess: () => { notify('ساعات کاری ذخیره شد.', 'success'); setDirty(false) },
        onError:   (err) => notify(extractError(err, 'خطا در ذخیره. دوباره تلاش کنید.'), 'error'),
      }
    )
  }

  const hasActive = week.some((d) => d.enabled)

  return (
    <section className="space-y-4">
      <SectionHeader step="۲" isDone={hasActive}>ساعات کاری هفتگی</SectionHeader>

      {isLoading && <Spinner />}
      {isError && (
        <div className="space-y-2">
          <ErrorMessage message="مشکلی در دریافت ساعات کاری پیش آمد." />
          <button onClick={() => refetch()} className="text-sm text-cyan-600 hover:underline">تلاش مجدد</button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Master time row */}
          <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-gray-500 shrink-0">اعمال به همه روزها:</span>
            <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
              <input
                type="time"
                value={masterStart}
                onChange={(e) => setMasterStart(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                dir="ltr"
              />
              <span className="text-gray-400 text-xs">تا</span>
              <input
                type="time"
                value={masterEnd}
                onChange={(e) => setMasterEnd(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white"
                dir="ltr"
              />
              <button
                onClick={applyMasterTime}
                type="button"
                className="text-xs bg-cyan-100 text-cyan-700 px-3 py-1.5 rounded-lg hover:bg-cyan-200 transition-colors font-medium"
              >
                اعمال
              </button>
            </div>
            <div className="flex gap-2 mr-auto shrink-0">
              <button onClick={() => toggleAll(true)}  type="button" className="text-xs text-green-600 hover:underline">انتخاب همه</button>
              <span className="text-gray-300">|</span>
              <button onClick={() => toggleAll(false)} type="button" className="text-xs text-red-400 hover:underline">حذف انتخاب</button>
            </div>
          </div>

          {/* Day rows */}
          {week.map((day, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0 transition-colors ${
                day.enabled ? 'bg-white' : 'bg-gray-50/60'
              }`}
            >
              {/* Toggle */}
              <label className="flex items-center gap-2 cursor-pointer shrink-0 w-24">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => updateDay(i, { enabled: e.target.checked })}
                  className="w-4 h-4 rounded accent-cyan-500"
                />
                <span className={`text-sm font-medium ${day.enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                  {WEEKDAYS[i]}
                </span>
              </label>

              {/* Time inputs */}
              {day.enabled ? (
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <input
                    type="time"
                    value={day.start_time}
                    onChange={(e) => updateDay(i, { start_time: e.target.value })}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white flex-1 min-w-[100px]"
                    dir="ltr"
                  />
                  <span className="text-gray-400 text-xs shrink-0">تا</span>
                  <input
                    type="time"
                    value={day.end_time}
                    onChange={(e) => updateDay(i, { end_time: e.target.value })}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent bg-white flex-1 min-w-[100px]"
                    dir="ltr"
                  />
                  {day.start_time && day.end_time && day.start_time < day.end_time && (
                    <span className="text-xs text-gray-400 shrink-0">
                      {calcDuration(day.start_time, day.end_time)}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400 flex-1">تعطیل</span>
              )}
            </div>
          ))}

          {/* Save button */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              type="button"
              className={`w-full text-sm py-2.5 rounded-xl font-medium transition-colors ${
                dirty
                  ? 'bg-cyan-500 text-white hover:bg-cyan-600'
                  : 'bg-gray-200 text-gray-500 cursor-default'
              } disabled:opacity-50`}
            >
              {saving ? 'در حال ذخیره...' : dirty ? 'ذخیره تغییرات' : 'تغییری وجود ندارد'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

function calcDuration(start, end) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}ساعت${m > 0 ? ` ${m}دقیقه` : ''}` : `${m}دقیقه`
}

// ── TimeOff section ───────────────────────────────────────────────────────────

function TimeOffSection({ providerId }) {
  const timeOffParams = providerId ? { provider_id: providerId } : {}
  const { data: timeoffs, isLoading, isError, refetch } = useMyTimeOffs(timeOffParams)
  const { mutate: addTimeOff,    isPending: adding   } = useCreateTimeOff()
  const { mutate: removeTimeOff, isPending: removing } = useDeleteTimeOff()

  const [form, setForm] = useState({
    date: '', is_full_day: true, start_time: '', end_time: '', reason: '',
  })

  function handleAdd(e) {
    e.preventDefault()
    const payload = { date: form.date, reason: form.reason.trim() }
    if (providerId) payload.provider = parseInt(providerId)
    if (!form.is_full_day) {
      payload.start_time = form.start_time
      payload.end_time   = form.end_time
    }
    addTimeOff(payload, {
      onSuccess: () => {
        notify('مرخصی با موفقیت ثبت شد.', 'success')
        setForm({ date: '', is_full_day: true, start_time: '', end_time: '', reason: '' })
      },
      onError: (err) => notify(extractError(err, 'خطا در ثبت مرخصی. دوباره تلاش کنید.'), 'error'),
    })
  }

  const hasTimeoffs = (timeoffs?.length ?? 0) > 0

  return (
    <section className="space-y-4">
      <SectionHeader step="۳" isDone={false}>مرخصی / تعطیلی</SectionHeader>

      {isLoading && <Spinner />}
      {isError && (
        <div className="space-y-2">
          <ErrorMessage message="مشکلی در دریافت مرخصی‌ها پیش آمد." />
          <button onClick={() => refetch()} className="text-sm text-cyan-600 hover:underline">تلاش مجدد</button>
        </div>
      )}

      {!isLoading && !isError && !hasTimeoffs && (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <CalendarXIcon size={16} className="opacity-40 shrink-0" />
          هیچ مرخصی یا تعطیلی ثبت نشده.
        </p>
      )}

      {timeoffs?.map((t) => {
        const isFullDay = !t.start_time && !t.end_time
        return (
          <Card key={t.id}>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="font-medium text-gray-800">{toJalali(t.date)}</span>
              <Badge variant={isFullDay ? 'danger' : 'warning'}>
                {isFullDay ? 'تمام روز' : 'جزئی'}
              </Badge>
              {!isFullDay && (
                <span className="font-mono text-gray-500 text-xs" dir="ltr">
                  {t.start_time}–{t.end_time}
                </span>
              )}
              {t.reason && <span className="text-gray-400 text-xs truncate max-w-[120px]">{t.reason}</span>}
            </div>
            <DeleteButton
              label={`حذف مرخصی ${t.date}`}
              onClick={() => removeTimeOff(t.id, {
                onSuccess: () => notify('مرخصی حذف شد.', 'success'),
                onError: () => notify('خطا در حذف مرخصی. دوباره تلاش کنید.', 'error'),
              })}
              disabled={removing}
            />
          </Card>
        )
      })}

      <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">افزودن مرخصی</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">تاریخ <span className="text-red-400">*</span></label>
            <input type="date" required value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className={inputCls} />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_full_day}
                onChange={(e) => setForm((p) => ({ ...p, is_full_day: e.target.checked }))}
                className="w-4 h-4 rounded accent-cyan-500"
              />
              تمام روز
            </label>
          </div>
        </div>

        {!form.is_full_day && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">از ساعت</label>
              <input type="time" required value={form.start_time}
                onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">تا ساعت</label>
              <input type="time" required value={form.end_time}
                onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500 block mb-1">دلیل (اختیاری)</label>
          <input type="text" placeholder="مثلاً: سفر، تعطیل رسمی"
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            className={inputCls} />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={adding}
          disabled={adding || !form.date}
        >
          افزودن مرخصی
        </Button>
      </form>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function GoLiveBanner({ navigate }) {
  return (
    <div className="bg-gradient-to-l from-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-md shadow-emerald-100/40"
         role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-white">
          <CalendarCheckIcon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-base">آماده دریافت نوبت هستید!</p>
          <p className="text-sm text-white/80 mt-0.5">
            خدمات و ساعات کاری تنظیم شده‌اند. لینک صفحه کسب‌وکار خود را با مشتریانتان به اشتراک بگذارید.
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        className="mt-3 text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
      >
        مشاهده داشبورد ←
      </button>
    </div>
  )
}

export default function SchedulePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const providerId = searchParams.get('provider_id') || null

  const { data: services, error: servicesError } = useMyServicesList()
  const { data: hours,    error: hoursError    } = useMyWorkingHours(providerId)

  // If backend returns 403, the user has no active business — redirect to create-business
  useEffect(() => {
    const err = servicesError || hoursError
    if (err?.response?.status === 403) {
      navigate('/create-business', { replace: true })
    }
  }, [servicesError, hoursError, navigate])

  const isLive = (services?.length ?? 0) > 0 && (hours?.length ?? 0) > 0

  return (
    <OwnerLayout
      title="برنامه نوبت‌ها"
      subtitle={providerId ? `ویرایش برنامه ارائه‌دهنده #${providerId}` : 'مدیریت خدمات، ساعات کاری و مرخصی‌ها'}
    >
      <div className="max-w-2xl space-y-10">
        {isLive && <GoLiveBanner navigate={navigate} />}
        <ServicesSection />
        <WorkingHoursSection providerId={providerId} />
        <TimeOffSection providerId={providerId} />
      </div>
    </OwnerLayout>
  )
}
