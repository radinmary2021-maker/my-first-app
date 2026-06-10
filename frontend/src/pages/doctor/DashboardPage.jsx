import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import OnboardingChecklist from '../../components/OnboardingChecklist'
import { notify } from '../../utils/toast'
import { useAuthStore } from '../../store/authStore'
import {
  useProviderAppointments,
  useBusinessAppointments,
  useCompleteAppointment,
  useNoShowAppointment,
  useProviderCancelAppointment,
} from '../../hooks/useAppointments'

const STATUS_LABEL = {
  pending:   'در انتظار تأیید',
  confirmed: 'تأیید شده',
  cancelled: 'لغو شده',
  completed: 'انجام شده',
  no_show:   'غیبت',
}

const STATUS_CLASS = {
  pending:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  confirmed: 'bg-green-50 text-green-700 border border-green-200',
  cancelled: 'bg-gray-100 text-gray-400',
  completed: 'bg-cyan-50 text-cyan-700',
  no_show:   'bg-red-50 text-red-600',
}

const STATUS_FILTERS = [
  { value: '',          label: 'همه' },
  { value: 'confirmed', label: 'تأیید شده' },
  { value: 'pending',   label: 'در انتظار' },
  { value: 'completed', label: 'انجام شده' },
  { value: 'cancelled', label: 'لغو شده' },
  { value: 'no_show',   label: 'غیبت' },
]

const DIALOG_COPY = {
  complete: { question: 'آیا این نوبت به پایان رسیده؟',         toast: 'نوبت تکمیل شد.' },
  no_show:  { question: 'آیا مشتری غیبت کرده؟',               toast: 'غیبت ثبت شد.' },
  cancel:   { question: 'آیا می‌خواهید این نوبت را لغو کنید؟', toast: 'نوبت لغو شد.' },
}

const todayStr = () => new Date().toISOString().split('T')[0]

function countToday(list = [], statuses) {
  const today = todayStr()
  return list.filter((a) => a.date === today && statuses.includes(a.status)).length
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)
  const isOwner  = user?.role === 'owner'

  const [filterStatus,  setFilterStatus]  = useState('')
  const [filterDate,    setFilterDate]    = useState('')
  const [confirmAction, setConfirmAction] = useState(null)

  const params = {}
  if (filterStatus) params.status = filterStatus
  if (filterDate)   params.date   = filterDate

  const businessResult = useBusinessAppointments(params, { enabled: isOwner })
  const providerResult = useProviderAppointments(params,  { enabled: !isOwner })
  const { data: appointments, isLoading, isError, refetch } = isOwner ? businessResult : providerResult

  const { mutate: complete,  isPending: completing  } = useCompleteAppointment()
  const { mutate: noShow,    isPending: markingNoShow } = useNoShowAppointment()
  const { mutate: cancel,    isPending: cancelling   } = useProviderCancelAppointment()
  const actionPending = completing || markingNoShow || cancelling

  // ── Metrics ────────────────────────────────────────────────────────────────
  const todayActive    = isOwner ? countToday(appointments, ['confirmed', 'pending']) : 0
  const todayPending   = isOwner ? countToday(appointments, ['pending'])   : 0
  const todayConfirmed = isOwner ? countToday(appointments, ['confirmed']) : 0
  const todayCompleted = isOwner ? countToday(appointments, ['completed']) : 0

  const providerTodayCount = !isOwner
    ? (appointments?.filter(
        (a) => a.date === todayStr() && (a.status === 'confirmed' || a.status === 'pending')
      ).length ?? 0)
    : 0

  const requestAction = useCallback((id, action) => setConfirmAction({ id, action }), [])

  function executeAction() {
    const { id, action } = confirmAction
    const copy = DIALOG_COPY[action]
    const handlers = {
      onSuccess: () => { setConfirmAction(null); notify(copy.toast, 'success') },
      onError:   (err) => { setConfirmAction(null); notify(err?.response?.data?.error || 'خطایی رخ داد.', 'error') },
    }
    if (action === 'complete') complete(id, handlers)
    else if (action === 'no_show') noShow(id, handlers)
    else if (action === 'cancel')  cancel(id, handlers)
  }

  // Today's appointment count for "today tab" display
  const todayCount = isOwner ? todayActive : providerTodayCount

  return (
    <MainLayout>
      <div className="space-y-5 max-w-3xl">

        {/* ── Onboarding checklist (owner only, hides at 100%) ── */}
        {isOwner && <OnboardingChecklist />}

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {isOwner ? 'داشبورد کسب‌وکار' : 'داشبورد ارائه‌دهنده'}
            </h1>
            {!isOwner && todayCount > 0 && (
              <p className="text-sm text-cyan-600 mt-0.5">
                {todayCount} نوبت فعال امروز
              </p>
            )}
          </div>
          <button
            onClick={() => navigate('/dashboard/schedule')}
            className="shrink-0 text-sm bg-cyan-500 text-white hover:bg-cyan-600 px-4 py-2 rounded-xl transition-colors shadow-sm"
          >
            مدیریت برنامه
          </button>
        </div>

        {/* ── Owner metrics bar ── */}
        {isOwner && !isLoading && !isError && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="owner-metrics">
            <MetricCard label="فعال امروز" value={todayActive}    color="cyan"   />
            <MetricCard label="در انتظار"  value={todayPending}   color="yellow" />
            <MetricCard label="تأیید شده"  value={todayConfirmed} color="green"  />
            <MetricCard label="انجام شده"  value={todayCompleted} color="gray"   />
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                aria-pressed={filterStatus === f.value}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filterStatus === f.value
                    ? 'bg-cyan-500 text-white border-cyan-500'
                    : 'border-gray-200 text-gray-600 hover:border-cyan-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 mr-auto">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              aria-label="فیلتر بر اساس تاریخ"
              className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap"
              >
                پاک کردن تاریخ
              </button>
            )}
          </div>
        </div>

        {/* ── States ── */}
        {isLoading && <Spinner className="py-20" />}

        {isError && (
          <div className="space-y-3">
            <ErrorMessage message="مشکلی در دریافت نوبت‌ها پیش آمد." />
            <p className="text-xs text-gray-400">
              ممکن است اتصال اینترنت قطع باشد یا سرور موقتاً در دسترس نباشد.
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm text-cyan-600 hover:underline font-medium"
            >
              تلاش مجدد
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && !isError && appointments?.length === 0 && (
          <EmptyState isOwner={isOwner} hasFilter={!!filterStatus || !!filterDate} />
        )}

        {/* ── Appointment list ── */}
        {!isLoading && !isError && appointments?.length > 0 && (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <AppointmentRow
                key={appt.id}
                appt={appt}
                showProvider={isOwner}
                onAction={(action) => requestAction(appt.id, action)}
                disabled={actionPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Confirm-action dialog ── */}
      {confirmAction && (
        <ConfirmDialog
          action={confirmAction.action}
          onConfirm={executeAction}
          onCancel={() => setConfirmAction(null)}
          isPending={actionPending}
        />
      )}
    </MainLayout>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function MetricCard({ label, value, color }) {
  const colorMap = {
    cyan:   'bg-cyan-50 text-cyan-700 border-cyan-100',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    green:  'bg-green-50 text-green-700 border-green-100',
    gray:   'bg-gray-50 text-gray-600 border-gray-100',
  }
  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${colorMap[color] ?? colorMap.gray}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5">{label}</p>
    </div>
  )
}

function EmptyState({ isOwner, hasFilter }) {
  if (hasFilter) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-3xl mb-3">🔍</p>
        <p className="text-sm font-medium text-gray-500">نوبتی با این فیلتر یافت نشد.</p>
        <p className="text-xs mt-1">فیلتر را تغییر دهید یا پاک کنید.</p>
      </div>
    )
  }

  return (
    <div className="text-center py-16 text-gray-400 space-y-3">
      <p className="text-4xl">📋</p>
      {isOwner ? (
        <>
          <p className="text-sm font-medium text-gray-600">هنوز نوبتی ثبت نشده است.</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
            برای دریافت نوبت، لینک صفحه کسب‌وکار خود را با مشتریان به اشتراک بگذارید.
          </p>
          <a
            href="/providers"
            className="inline-block mt-1 text-xs text-cyan-600 hover:underline font-medium"
          >
            مشاهده صفحه عمومی کسب‌وکار
          </a>
        </>
      ) : (
        <p className="text-sm text-gray-500">نوبتی یافت نشد.</p>
      )}
    </div>
  )
}

function AppointmentRow({ appt, showProvider, onAction, disabled }) {
  const isConfirmed = appt.status === 'confirmed'
  const isToday     = appt.date === todayStr()

  return (
    <div
      data-testid="appointment-row"
      className={`bg-white rounded-2xl border shadow-sm p-4 transition-colors ${
        isToday ? 'border-cyan-200 ring-1 ring-cyan-100' : 'border-gray-100'
      }`}
    >
      {/* Today badge */}
      {isToday && (
        <div className="flex items-center gap-1 mb-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block" />
            امروز
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-bold text-gray-800 truncate">{appt.customer_name || '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">{appt.customer_phone}</p>
          {showProvider && appt.provider_name && (
            <p className="text-xs text-cyan-600 mt-0.5">ارائه‌دهنده: {appt.provider_name}</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${STATUS_CLASS[appt.status] ?? 'bg-gray-100 text-gray-500'}`}>
          {STATUS_LABEL[appt.status] ?? appt.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 border-t border-gray-50 pt-3 mb-3">
        <div>
          <span className="text-gray-400 block mb-0.5">تاریخ</span>
          <span dir="ltr" className="font-medium">{appt.date}</span>
        </div>
        <div>
          <span className="text-gray-400 block mb-0.5">ساعت</span>
          <span className="font-mono font-medium">{appt.start_time}–{appt.end_time}</span>
        </div>
        <div>
          <span className="text-gray-400 block mb-0.5">{appt.service_name ? 'سرویس' : 'کد پیگیری'}</span>
          <span className="font-mono text-gray-800 truncate block">{appt.service_name || appt.tracking_code}</span>
        </div>
      </div>

      {isConfirmed && (
        <div className="flex gap-2">
          <button
            onClick={() => onAction('complete')}
            disabled={disabled}
            className="flex-1 bg-green-50 text-green-700 text-xs py-2.5 rounded-xl hover:bg-green-100 disabled:opacity-50 transition-colors min-h-[40px]"
          >
            انجام شد
          </button>
          <button
            onClick={() => onAction('no_show')}
            disabled={disabled}
            className="flex-1 bg-orange-50 text-orange-700 text-xs py-2.5 rounded-xl hover:bg-orange-100 disabled:opacity-50 transition-colors min-h-[40px]"
          >
            غیبت
          </button>
          <button
            onClick={() => onAction('cancel')}
            disabled={disabled}
            className="flex-1 bg-red-50 text-red-600 text-xs py-2.5 rounded-xl hover:bg-red-100 disabled:opacity-50 transition-colors min-h-[40px]"
          >
            لغو
          </button>
        </div>
      )}
    </div>
  )
}

function ConfirmDialog({ action, onConfirm, onCancel, isPending }) {
  const copy = DIALOG_COPY[action] ?? { question: 'آیا مطمئن هستید؟' }
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-label="تأیید عملیات"
      onClick={(e) => e.target === e.currentTarget && !isPending && onCancel()}
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4" dir="rtl">
        <h2 className="text-base font-bold text-gray-800">تأیید عملیات</h2>
        <p className="text-sm text-gray-600">{copy.question}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isPending}
            autoFocus
            className={`flex-1 text-white py-3 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors min-h-[44px] ${
              action === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-500 hover:bg-cyan-600'
            }`}
          >
            {isPending ? 'در حال پردازش...' : 'تأیید'}
          </button>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  )
}
