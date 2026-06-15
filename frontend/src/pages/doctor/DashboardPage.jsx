import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import OnboardingChecklist from '../../components/OnboardingChecklist'
import Button from '../../components/Button'
import Badge, { APPOINTMENT_STATUS_LABEL } from '../../components/Badge'
import Input from '../../components/Input'
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  BarChart2Icon,
  SearchIcon,
  RefreshCwIcon,
  UsersIcon,
} from '../../components/Icon'
import { notify } from '../../utils/toast'
import { toJalali } from '../../utils/jalali'
import { useAuthStore } from '../../store/authStore'
import {
  useProviderAppointments,
  useBusinessAppointments,
  useCompleteAppointment,
  useNoShowAppointment,
  useProviderCancelAppointment,
  useConfirmAppointment,
} from '../../hooks/useAppointments'

const STATUS_FILTERS = [
  { value: '',          label: 'همه' },
  { value: 'confirmed', label: 'تأیید شده' },
  { value: 'pending',   label: 'در انتظار' },
  { value: 'completed', label: 'انجام شده' },
  { value: 'cancelled', label: 'لغو شده' },
  { value: 'no_show',   label: 'غیبت' },
]

const DIALOG_COPY = {
  confirm:  { question: 'آیا این نوبت را تأیید می‌کنید؟',       toast: 'نوبت تأیید شد.' },
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

  const { mutate: confirm,   isPending: confirming    } = useConfirmAppointment()
  const { mutate: complete,  isPending: completing    } = useCompleteAppointment()
  const { mutate: noShow,    isPending: markingNoShow  } = useNoShowAppointment()
  const { mutate: cancel,    isPending: cancelling     } = useProviderCancelAppointment()
  const actionPending = confirming || completing || markingNoShow || cancelling

  const metrics = useMemo(() => ({
    todayActive:    isOwner ? countToday(appointments, ['confirmed', 'pending']) : 0,
    todayPending:   isOwner ? countToday(appointments, ['pending'])   : 0,
    todayConfirmed: isOwner ? countToday(appointments, ['confirmed']) : 0,
    todayCompleted: isOwner ? countToday(appointments, ['completed']) : 0,
  }), [appointments, isOwner])

  const providerTodayCount = !isOwner
    ? (appointments?.filter(
        (a) => a.date === todayStr() && (a.status === 'confirmed' || a.status === 'pending')
      ).length ?? 0)
    : 0

  const todayCount = isOwner ? metrics.todayActive : providerTodayCount

  const requestAction = useCallback((id, action) => setConfirmAction({ id, action }), [])

  function executeAction() {
    const { id, action } = confirmAction
    const copy = DIALOG_COPY[action]
    const handlers = {
      onSuccess: () => { setConfirmAction(null); notify(copy.toast, 'success') },
      onError:   (err) => { setConfirmAction(null); notify(err?.response?.data?.error || 'خطایی رخ داد.', 'error') },
    }
    if (action === 'confirm')       confirm(id, handlers)
    else if (action === 'complete') complete(id, handlers)
    else if (action === 'no_show')  noShow(id, handlers)
    else if (action === 'cancel')   cancel(id, handlers)
  }

  return (
    <MainLayout>
      <div className="space-y-5 max-w-3xl">

        {isOwner && <OnboardingChecklist />}

        {/* Page header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {isOwner ? 'داشبورد کسب‌وکار' : 'داشبورد ارائه‌دهنده'}
            </h1>
            {!isOwner && todayCount > 0 && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-brand)' }}>
                {todayCount} نوبت فعال امروز
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard/schedule')}>
              <CalendarIcon size={14} />
              مدیریت برنامه
            </Button>
            {isOwner && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/providers')}>
                <UsersIcon size={14} />
                ارائه‌دهندگان
              </Button>
            )}
          </div>
        </div>

        {/* Owner metrics */}
        {isOwner && !isLoading && !isError && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="owner-metrics">
            <MetricCard label="فعال امروز"  value={metrics.todayActive}    icon={<BarChart2Icon size={18} />}    colorVar="--color-brand"   bgVar="--color-brand-light" />
            <MetricCard label="در انتظار"   value={metrics.todayPending}   icon={<ClockIcon size={18} />}        colorVar="--color-warning" bgVar="--color-warning-bg" />
            <MetricCard label="تأیید شده"   value={metrics.todayConfirmed} icon={<CheckCircleIcon size={18} />} colorVar="--color-success" bgVar="--color-success-bg" />
            <MetricCard label="انجام شده"   value={metrics.todayCompleted} icon={<CalendarIcon size={18} />}    colorVar="--color-text-secondary" bgVar="--color-surface" />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <Button
                key={f.value}
                size="sm"
                variant={filterStatus === f.value ? 'primary' : 'ghost'}
                aria-pressed={filterStatus === f.value}
                className="rounded-full text-xs"
                onClick={() => setFilterStatus(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2 mr-auto">
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              aria-label="فیلتر بر اساس تاریخ"
              forceLtr
              className="text-sm py-1.5"
            />
            {filterDate && (
              <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>
                پاک کردن
              </Button>
            )}
          </div>
        </div>

        {isLoading && <Spinner className="py-20" />}

        {isError && (
          <div className="space-y-3">
            <ErrorMessage message="مشکلی در دریافت نوبت‌ها پیش آمد." />
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              ممکن است اتصال اینترنت قطع باشد یا سرور موقتاً در دسترس نباشد.
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCwIcon size={14} />
              تلاش مجدد
            </Button>
          </div>
        )}

        {!isLoading && !isError && appointments?.length === 0 && (
          <EmptyState isOwner={isOwner} hasFilter={!!filterStatus || !!filterDate} />
        )}

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

// ── Sub-components ──────────────────────────────────────────────────────────────

function MetricCard({ label, value, icon, colorVar, bgVar }) {
  return (
    <div
      className="card px-4 py-3 text-center"
      style={{ backgroundColor: `var(${bgVar})`, borderColor: 'transparent' }}
    >
      <div
        className="flex items-center justify-center mb-1"
        style={{ color: `var(${colorVar})` }}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold" style={{ color: `var(${colorVar})` }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
    </div>
  )
}

function EmptyState({ isOwner, hasFilter }) {
  if (hasFilter) {
    return (
      <div className="text-center py-16">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <SearchIcon size={28} style={{ color: 'var(--color-text-tertiary)' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          نوبتی با این فیلتر یافت نشد.
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          فیلتر را تغییر دهید یا پاک کنید.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center py-16 space-y-3">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
        style={{ backgroundColor: 'var(--color-brand-light)' }}
      >
        <CalendarIcon size={28} style={{ color: 'var(--color-brand)' }} />
      </div>
      {isOwner ? (
        <>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            هنوز نوبتی ثبت نشده است.
          </p>
          <p className="text-xs max-w-xs mx-auto leading-relaxed" style={{ color: 'var(--color-text-tertiary)' }}>
            برای دریافت نوبت، لینک صفحه کسب‌وکار خود را با مشتریان به اشتراک بگذارید.
          </p>
          <Button variant="ghost" size="sm" as="a" href="/providers">
            مشاهده صفحه عمومی کسب‌وکار
          </Button>
        </>
      ) : (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          نوبتی یافت نشد.
        </p>
      )}
    </div>
  )
}

function AppointmentRow({ appt, showProvider, onAction, disabled }) {
  const isConfirmed = appt.status === 'confirmed'
  const isPending   = appt.status === 'pending'
  const isToday     = appt.date === todayStr()

  return (
    <div
      data-testid="appointment-row"
      className="card p-4 transition-colors"
      style={isToday ? { borderColor: 'var(--color-brand)', boxShadow: '0 0 0 1px var(--color-brand-light)' } : {}}
    >
      {isToday && (
        <div className="flex items-center gap-1 mb-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--color-brand-light)', color: 'var(--color-brand-dark)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: 'var(--color-brand)' }}
            />
            امروز
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {appt.customer_name || '—'}
          </p>
          <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
            {appt.customer_phone}
          </p>
          {showProvider && appt.provider_name && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-brand)' }}>
              ارائه‌دهنده: {appt.provider_name}
            </p>
          )}
        </div>
        <Badge variant={appt.status} className="shrink-0">
          {APPOINTMENT_STATUS_LABEL[appt.status] ?? appt.status}
        </Badge>
      </div>

      <div
        className="grid grid-cols-3 gap-2 text-xs border-t pt-3 mb-3"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
      >
        <div>
          <span
            className="flex items-center gap-1 mb-0.5"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <CalendarIcon size={10} />
            تاریخ
          </span>
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {toJalali(appt.date)}
          </span>
        </div>
        <div>
          <span
            className="flex items-center gap-1 mb-0.5"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <ClockIcon size={10} />
            ساعت
          </span>
          <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {appt.start_time}–{appt.end_time}
          </span>
        </div>
        <div>
          <span className="block mb-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {appt.service_name ? 'سرویس' : 'کد پیگیری'}
          </span>
          <span className="font-mono truncate block" style={{ color: 'var(--color-text-primary)' }}>
            {appt.service_name || appt.tracking_code}
          </span>
        </div>
      </div>

      {isPending && (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" fullWidth disabled={disabled} onClick={() => onAction('confirm')}>
            تأیید نوبت
          </Button>
          <Button variant="danger" size="sm" fullWidth disabled={disabled} onClick={() => onAction('cancel')}>
            لغو
          </Button>
        </div>
      )}

      {isConfirmed && (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" fullWidth disabled={disabled} onClick={() => onAction('complete')}>
            انجام شد
          </Button>
          <Button variant="ghost" size="sm" fullWidth disabled={disabled} onClick={() => onAction('no_show')}>
            غیبت
          </Button>
          <Button variant="danger" size="sm" fullWidth disabled={disabled} onClick={() => onAction('cancel')}>
            لغو
          </Button>
        </div>
      )}
    </div>
  )
}

function ConfirmDialog({ action, onConfirm, onCancel, isPending }) {
  const copy = DIALOG_COPY[action] ?? { question: 'آیا مطمئن هستید؟' }
  const isDanger = action === 'cancel'

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-label="تأیید عملیات"
      onClick={(e) => e.target === e.currentTarget && !isPending && onCancel()}
    >
      <div className="card p-6 w-full max-w-sm space-y-4" dir="rtl">
        <h2 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
          تأیید عملیات
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {copy.question}
        </p>
        <div className="flex gap-3">
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            fullWidth
            loading={isPending}
            autoFocus
            onClick={onConfirm}
          >
            تأیید
          </Button>
          <Button
            variant="ghost"
            fullWidth
            disabled={isPending}
            onClick={onCancel}
          >
            انصراف
          </Button>
        </div>
      </div>
    </div>
  )
}
