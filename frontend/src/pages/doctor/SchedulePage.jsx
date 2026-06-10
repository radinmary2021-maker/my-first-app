import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import { notify } from '../../utils/toast'
import {
  useMyWorkingHours,
  useCreateWorkingHours,
  useDeleteWorkingHours,
  useMyTimeOffs,
  useCreateTimeOff,
  useDeleteTimeOff,
  useMyServicesList,
  useCreateService,
  useDeleteService,
} from '../../hooks/useDoctorSchedule'

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

const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-200 bg-white'

// ── Services section ──────────────────────────────────────────────────────────

function ServicesSection() {
  const { data: services, isLoading, isError, refetch } = useMyServicesList()
  const { mutate: addService,    isPending: adding   } = useCreateService()
  const { mutate: removeService, isPending: removing } = useDeleteService()

  const [form, setForm] = useState({
    name: '', duration_minutes: '30', buffer_minutes: '0', price: '0', description: '',
  })

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
          setForm({ name: '', duration_minutes: '30', buffer_minutes: '0', price: '0', description: '' })
        },
        onError: (err) => notify(extractError(err, 'خطا در ذخیره خدمت. دوباره تلاش کنید.'), 'error'),
      }
    )
  }

  const hasSvcs = (services?.length ?? 0) > 0

  return (
    <section className="space-y-4">
      <SectionHeader step="۱" isDone={hasSvcs}>خدمات</SectionHeader>

      {isLoading && <Spinner />}
      {isError && (
        <div className="space-y-2">
          <ErrorMessage message="مشکلی در دریافت خدمات پیش آمد." />
          <button onClick={() => refetch()} className="text-sm text-cyan-600 hover:underline">تلاش مجدد</button>
        </div>
      )}

      {!isLoading && !isError && !hasSvcs && (
        <div className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
          هیچ خدمتی ثبت نشده. اولین خدمت خود را از فرم زیر اضافه کنید.
        </div>
      )}

      {services?.map((svc) => (
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
          <DeleteButton
            label={`حذف خدمت ${svc.name}`}
            onClick={() => removeService(svc.id, {
              onSuccess: () => notify('خدمت حذف شد.', 'success'),
              onError: () => notify('خطا در حذف خدمت. دوباره تلاش کنید.', 'error'),
            })}
            disabled={removing}
          />
        </Card>
      ))}

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
            <input type="number" min="5" required value={form.duration_minutes}
              onChange={(e) => setForm((p) => ({ ...p, duration_minutes: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">فاصله بعد از نوبت (دقیقه)</label>
            <input type="number" min="0" value={form.buffer_minutes}
              onChange={(e) => setForm((p) => ({ ...p, buffer_minutes: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">قیمت (تومان)</label>
            <input type="number" min="0" value={form.price}
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
        <button
          type="submit"
          disabled={adding || !form.name.trim()}
          className="w-full bg-cyan-500 text-white text-sm py-2.5 rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
        >
          {adding ? 'در حال ذخیره...' : 'افزودن خدمت'}
        </button>
      </form>
    </section>
  )
}

// ── Working hours section ─────────────────────────────────────────────────────

function WorkingHoursSection() {
  const { data: hours, isLoading, isError, refetch } = useMyWorkingHours()
  const { mutate: addHours,    isPending: adding   } = useCreateWorkingHours()
  const { mutate: removeHours, isPending: removing } = useDeleteWorkingHours()

  const [form, setForm] = useState({ weekday: '0', start_time: '', end_time: '' })

  const existingWeekdays = new Set(hours?.map((h) => h.weekday) ?? [])
  const hasHours = (hours?.length ?? 0) > 0

  function handleAdd(e) {
    e.preventDefault()
    if (!form.start_time || !form.end_time) {
      notify('ساعت شروع و پایان الزامی است.', 'error')
      return
    }
    if (form.start_time >= form.end_time) {
      notify('ساعت شروع باید قبل از ساعت پایان باشد.', 'error')
      return
    }
    addHours(
      { ...form, weekday: parseInt(form.weekday) },
      {
        onSuccess: () => {
          notify('ساعت کاری اضافه شد.', 'success')
          setForm({ weekday: '0', start_time: '', end_time: '' })
        },
        onError: (err) => notify(extractError(err, 'خطا در ذخیره ساعت کاری. دوباره تلاش کنید.'), 'error'),
      }
    )
  }

  return (
    <section className="space-y-4">
      <SectionHeader step="۲" isDone={hasHours}>ساعات کاری هفتگی</SectionHeader>

      {isLoading && <Spinner />}
      {isError && (
        <div className="space-y-2">
          <ErrorMessage message="مشکلی در دریافت ساعات کاری پیش آمد." />
          <button onClick={() => refetch()} className="text-sm text-cyan-600 hover:underline">تلاش مجدد</button>
        </div>
      )}

      {!isLoading && !isError && !hasHours && (
        <div className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
          هنوز ساعت کاری ثبت نشده. روزها و ساعاتی که نوبت می‌پذیرید را اضافه کنید.
        </div>
      )}

      {hours?.map((h) => (
        <Card key={h.id}>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-medium text-gray-800 w-16 shrink-0">{WEEKDAYS[h.weekday]}</span>
            <span className="font-mono text-gray-600" dir="ltr">{h.start_time} – {h.end_time}</span>
            {!h.is_active && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">غیرفعال</span>}
          </div>
          <DeleteButton
            label={`حذف ساعت کاری ${WEEKDAYS[h.weekday]}`}
            onClick={() => removeHours(h.id, {
              onSuccess: () => notify('ساعت کاری حذف شد.', 'success'),
              onError: () => notify('خطا در حذف ساعت کاری. دوباره تلاش کنید.', 'error'),
            })}
            disabled={removing}
          />
        </Card>
      ))}

      <form onSubmit={handleAdd} className="bg-gray-50 rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">افزودن روز جدید</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">روز هفته</label>
            <select
              value={form.weekday}
              onChange={(e) => setForm((p) => ({ ...p, weekday: e.target.value }))}
              className={inputCls}
            >
              {WEEKDAYS.map((name, idx) => (
                <option key={idx} value={idx} disabled={existingWeekdays.has(idx)}>
                  {name}{existingWeekdays.has(idx) ? ' (ثبت شده)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">از ساعت <span className="text-red-400">*</span></label>
            <input type="time" required value={form.start_time}
              onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">تا ساعت <span className="text-red-400">*</span></label>
            <input type="time" required value={form.end_time}
              onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
              className={inputCls} />
          </div>
        </div>
        <button
          type="submit"
          disabled={adding}
          className="w-full bg-cyan-500 text-white text-sm py-2.5 rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
        >
          {adding ? 'در حال ذخیره...' : 'افزودن'}
        </button>
      </form>
    </section>
  )
}

// ── TimeOff section ───────────────────────────────────────────────────────────

function TimeOffSection() {
  const { data: timeoffs, isLoading, isError, refetch } = useMyTimeOffs()
  const { mutate: addTimeOff,    isPending: adding   } = useCreateTimeOff()
  const { mutate: removeTimeOff, isPending: removing } = useDeleteTimeOff()

  const [form, setForm] = useState({
    date: '', is_full_day: true, start_time: '', end_time: '', reason: '',
  })

  function handleAdd(e) {
    e.preventDefault()
    const payload = { date: form.date, reason: form.reason.trim() }
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
        <p className="text-sm text-gray-400">هیچ مرخصی یا تعطیلی ثبت نشده.</p>
      )}

      {timeoffs?.map((t) => {
        const isFullDay = !t.start_time && !t.end_time
        return (
          <Card key={t.id}>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="font-mono font-medium text-gray-800" dir="ltr">{t.date}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isFullDay ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'
              }`}>
                {isFullDay ? 'تمام روز' : 'جزئی'}
              </span>
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

        <button
          type="submit"
          disabled={adding || !form.date}
          className="w-full bg-cyan-500 text-white text-sm py-2.5 rounded-lg hover:bg-cyan-600 disabled:opacity-50 transition-colors"
        >
          {adding ? 'در حال ذخیره...' : 'افزودن مرخصی'}
        </button>
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
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 text-xl">
          🎉
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

  const { data: services } = useMyServicesList()
  const { data: hours    } = useMyWorkingHours()

  const isLive = (services?.length ?? 0) > 0 && (hours?.length ?? 0) > 0

  return (
    <MainLayout>
      <div className="max-w-2xl space-y-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="بازگشت به داشبورد"
          >
            ← داشبورد
          </button>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-800">مدیریت برنامه</h1>
        </div>

        <p className="text-sm text-gray-500 -mt-6">
          برنامه کاری و تنظیمات پذیرش نوبت خود را از اینجا مدیریت کنید.
        </p>

        {isLive && <GoLiveBanner navigate={navigate} />}

        <ServicesSection />
        <WorkingHoursSection />
        <TimeOffSection />
      </div>
    </MainLayout>
  )
}
