import { useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import OwnerLayout from '../../layouts/OwnerLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import OnboardingChecklist from '../../components/OnboardingChecklist'
import Button from '../../components/Button'
import Badge, { APPOINTMENT_STATUS_LABEL } from '../../components/Badge'
import Input from '../../components/Input'
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

function getInitials(name) {
  if (!name) return '؟'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return parts[0][0] + '.' + parts[1][0]
  return parts[0].slice(0, 2)
}

const STATUS_BADGE_COLORS = {
  confirmed: 'bg-emerald-50 text-emerald-600',
  pending:   'bg-amber-50 text-amber-600',
  completed: 'bg-cyan-50 text-cyan-600',
  cancelled: 'bg-slate-100 text-slate-500',
  no_show:   'bg-rose-50 text-rose-600',
  pending_payment: 'bg-amber-50 text-amber-600',
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
    todayActive:    countToday(appointments, ['confirmed', 'pending']),
    todayPending:   countToday(appointments, ['pending']),
    todayConfirmed: countToday(appointments, ['confirmed']),
    todayCompleted: countToday(appointments, ['completed']),
  }), [appointments])

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

  const todayJalali = toJalali(todayStr())

  return (
    <OwnerLayout
      title={isOwner ? 'داشبورد کسب‌وکار' : 'داشبورد ارائه‌دهنده'}
      subtitle={todayJalali}
      headerAction={
        <button
          onClick={() => navigate('/dashboard/schedule')}
          className="text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-cyan-200 flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          مدیریت برنامه
        </button>
      }
    >
      {isOwner && <OnboardingChecklist />}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /></>} iconBg="bg-cyan-50" iconColor="text-cyan-600" value={todayCount} label="نوبت امروز" />
        <StatCard icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>} iconBg="bg-purple-50" iconColor="text-purple-600" value={appointments?.length ?? 0} label="کل نوبت‌ها" />
        <StatCard icon={<path d="M18 20V10M12 20V4M6 20v-6" />} iconBg="bg-emerald-50" iconColor="text-emerald-600" value={metrics.todayCompleted} label="انجام شده امروز" />
        <StatCard icon={<path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />} iconBg="bg-amber-50" iconColor="text-amber-600" value={metrics.todayPending} label="در انتظار تأیید" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Appointments list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-800">نوبت‌ها</h2>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                aria-label="فیلتر بر اساس تاریخ"
                forceLtr
                className="text-xs py-1"
              />
              {filterDate && (
                <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>
                  پاک کردن
                </Button>
              )}
            </div>
          </div>

          {/* Status filter pills */}
          <div className="flex gap-1 px-5 py-3 border-b border-slate-50 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                aria-pressed={filterStatus === f.value}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  filterStatus === f.value
                    ? 'bg-cyan-500 text-white border-cyan-500'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-cyan-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading && <div className="py-16 flex justify-center"><Spinner /></div>}
          {isError && <div className="p-5"><ErrorMessage message="مشکلی در دریافت نوبت‌ها پیش آمد." /></div>}

          {!isLoading && !isError && appointments?.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm text-slate-400">نوبتی یافت نشد.</p>
            </div>
          )}

          {!isLoading && !isError && appointments?.length > 0 && (
            <div className="divide-y divide-slate-50">
              {appointments.map((appt) => (
                <div key={appt.id} data-testid="appointment-row" className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="text-center w-14 shrink-0">
                    <div className="text-sm font-black text-slate-700">{appt.start_time?.slice(0, 5)}</div>
                    <div className="text-[10px] text-slate-400">{toJalali(appt.date)}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-xs font-bold text-cyan-700 shrink-0">
                    {getInitials(appt.customer_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800">{appt.customer_name || '—'}</div>
                    <div className="text-xs text-slate-400">
                      {appt.service_name || appt.tracking_code}
                      {isOwner && appt.provider_name && ` · با ${appt.provider_name}`}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE_COLORS[appt.status] || 'bg-slate-100 text-slate-500'}`}>
                    {APPOINTMENT_STATUS_LABEL[appt.status] ?? appt.status}
                  </span>
                  {(appt.status === 'confirmed' || appt.status === 'pending') && (
                    <div className="flex gap-1 shrink-0">
                      {appt.status === 'pending' && (
                        <button onClick={() => requestAction(appt.id, 'confirm')} disabled={actionPending}
                                className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-lg hover:bg-cyan-100 transition-colors disabled:opacity-50">تأیید</button>
                      )}
                      {appt.status === 'confirmed' && (
                        <button onClick={() => requestAction(appt.id, 'complete')} disabled={actionPending}
                                className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50">انجام شد</button>
                      )}
                      {appt.status === 'confirmed' && (
                        <button onClick={() => requestAction(appt.id, 'no_show')} disabled={actionPending}
                                className="text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50">غیبت</button>
                      )}
                      <button onClick={() => requestAction(appt.id, 'cancel')} disabled={actionPending}
                              className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50">لغو</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4">دسترسی سریع</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickCard label="برنامه نوبت" bg="#ECFEFF" grad="from-cyan-600 to-cyan-400" textColor="text-cyan-700"
                         icon={<><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /><path d="M8 2v4M16 2v4" /></>}
                         onClick={() => navigate('/dashboard/schedule')} />
              <QuickCard label="افزودن متخصص" bg="#F5F3FF" grad="from-violet-600 to-violet-400" textColor="text-purple-700"
                         icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>}
                         onClick={() => navigate('/dashboard/providers')} />
              <QuickCard label="مشاهده گزارش" bg="#ECFDF5" grad="from-emerald-600 to-emerald-400" textColor="text-emerald-700"
                         icon={<path d="M18 20V10M12 20V4M6 20v-6" />}
                         onClick={() => navigate('/dashboard/reports')} />
              <QuickCard label="تنظیمات" bg="#FFF7ED" grad="from-orange-600 to-orange-400" textColor="text-orange-700"
                         icon={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>}
                         onClick={() => navigate('/dashboard/settings')} />
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0"
          role="dialog" aria-modal="true" aria-label="تأیید عملیات"
          onClick={(e) => e.target === e.currentTarget && !actionPending && setConfirmAction(null)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 border border-slate-100 shadow-xl" dir="rtl">
            <h2 className="text-base font-bold text-slate-900">تأیید عملیات</h2>
            <p className="text-sm text-slate-500">{DIALOG_COPY[confirmAction.action]?.question}</p>
            <div className="flex gap-3">
              <Button
                variant={confirmAction.action === 'cancel' ? 'danger' : 'primary'}
                fullWidth loading={actionPending} autoFocus onClick={executeAction}
              >
                تأیید
              </Button>
              <Button variant="ghost" fullWidth disabled={actionPending} onClick={() => setConfirmAction(null)}>
                انصراف
              </Button>
            </div>
          </div>
        </div>
      )}
    </OwnerLayout>
  )
}

function StatCard({ icon, iconBg, iconColor, value, label }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-lg transition-shadow">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-2`}>
        <svg className={`w-4 h-4 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
      </div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  )
}

function QuickCard({ label, bg, grad, textColor, icon, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]" style={{ background: bg }}>
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center transition-transform duration-200 hover:scale-110 hover:-rotate-6`}>
        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
      </div>
      <span className={`text-xs font-bold ${textColor}`}>{label}</span>
    </button>
  )
}
