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

const STATUS_BADGE_STYLES = {
  confirmed:       { background: 'rgba(57,255,20,0.1)', color: '#39FF14' },
  pending:         { background: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
  completed:       { background: 'rgba(0,212,200,0.08)', color: '#00D4C8' },
  cancelled:       { background: 'rgba(0,212,200,0.05)', color: '#4A6E8A' },
  no_show:         { background: 'rgba(239,68,68,0.1)', color: '#EF4444' },
  pending_payment: { background: 'rgba(245,158,11,0.1)', color: '#F59E0B' },
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
          className="text-white text-sm font-extrabold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all"
          style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
          مدیریت برنامه
        </button>
      }
    >
      {isOwner && <OnboardingChecklist />}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /></>} iconColor="#00D4C8" value={todayCount} label="نوبت امروز" />
        <StatCard icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>} iconColor="#00D4C8" value={appointments?.length ?? 0} label="کل نوبت‌ها" />
        <StatCard icon={<path d="M18 20V10M12 20V4M6 20v-6" />} iconColor="#39FF14" value={metrics.todayCompleted} label="انجام شده امروز" />
        <StatCard icon={<path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />} iconColor="#FF6B2B" value={metrics.todayPending} label="در انتظار تأیید" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Appointments list */}
        <div className="lg:col-span-2 rounded-[20px] overflow-hidden" style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}>
          <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
            <h2 className="text-sm font-bold" style={{ color: '#DCF0F5' }}>نوبت‌ها</h2>
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
          <div className="flex gap-1 px-5 py-3 flex-wrap" style={{ borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilterStatus(f.value)}
                aria-pressed={filterStatus === f.value}
                className="text-xs font-bold px-3 py-1.5 rounded-full transition-colors"
                style={filterStatus === f.value
                  ? { background: 'rgba(0,212,200,0.15)', color: '#00D4C8', border: '1px solid rgba(0,212,200,0.3)' }
                  : { background: 'transparent', color: '#4A6E8A', border: '1px solid rgba(0,212,200,0.12)' }
                }
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoading && <div className="py-16 flex justify-center"><Spinner /></div>}
          {isError && <div className="p-5"><ErrorMessage message="مشکلی در دریافت نوبت‌ها پیش آمد." /></div>}

          {!isLoading && !isError && appointments?.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: '#4A6E8A' }}>نوبتی یافت نشد.</p>
            </div>
          )}

          {!isLoading && !isError && appointments?.length > 0 && (
            <div>
              {appointments.map((appt) => (
                <div key={appt.id} data-testid="appointment-row" className="flex items-center gap-4 p-4 transition-colors"
                     style={{ borderBottom: '1px solid rgba(0,212,200,0.04)' }}
                     onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,212,200,0.03)'}
                     onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                  <div className="text-center w-14 shrink-0">
                    <div className="text-sm font-black" style={{ color: '#DCF0F5' }}>{appt.start_time?.slice(0, 5)}</div>
                    <div className="text-[10px]" style={{ color: '#4A6E8A' }}>{toJalali(appt.date)}</div>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                       style={{ background: 'rgba(0,212,200,0.1)', color: '#00D4C8' }}>
                    {getInitials(appt.customer_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: '#DCF0F5' }}>{appt.customer_name || '—'}</div>
                    <div className="text-xs" style={{ color: '#4A6E8A' }}>
                      {appt.service_name || appt.tracking_code}
                      {isOwner && appt.provider_name && ` · با ${appt.provider_name}`}
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
                        style={STATUS_BADGE_STYLES[appt.status] || { background: 'rgba(0,212,200,0.05)', color: '#4A6E8A' }}>
                    {APPOINTMENT_STATUS_LABEL[appt.status] ?? appt.status}
                  </span>
                  {(appt.status === 'confirmed' || appt.status === 'pending') && (
                    <div className="flex gap-1 shrink-0">
                      {appt.status === 'pending' && (
                        <button onClick={() => requestAction(appt.id, 'confirm')} disabled={actionPending}
                                className="text-xs font-bold px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                                style={{ color: '#00D4C8', background: 'rgba(0,212,200,0.08)' }}>تأیید</button>
                      )}
                      {appt.status === 'confirmed' && (
                        <button onClick={() => requestAction(appt.id, 'complete')} disabled={actionPending}
                                className="text-xs font-bold px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                                style={{ color: '#39FF14', background: 'rgba(57,255,20,0.08)' }}>انجام شد</button>
                      )}
                      {appt.status === 'confirmed' && (
                        <button onClick={() => requestAction(appt.id, 'no_show')} disabled={actionPending}
                                className="text-xs font-bold px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                                style={{ color: '#4A6E8A', background: 'rgba(0,212,200,0.04)' }}>غیبت</button>
                      )}
                      <button onClick={() => requestAction(appt.id, 'cancel')} disabled={actionPending}
                              className="text-xs font-bold px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                              style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}>لغو</button>
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
          <div className="rounded-[20px] p-5" style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: '#DCF0F5' }}>دسترسی سریع</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickCard label="برنامه نوبت" iconColor="#00D4C8"
                         icon={<><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /><path d="M8 2v4M16 2v4" /></>}
                         onClick={() => navigate('/dashboard/schedule')} />
              <QuickCard label="افزودن متخصص" iconColor="#00D4C8"
                         icon={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>}
                         onClick={() => navigate('/dashboard/providers')} />
              <QuickCard label="مشاهده گزارش" iconColor="#39FF14"
                         icon={<path d="M18 20V10M12 20V4M6 20v-6" />}
                         onClick={() => navigate('/dashboard/reports')} />
              <QuickCard label="تنظیمات" iconColor="#FF6B2B"
                         icon={<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>}
                         onClick={() => navigate('/dashboard/settings')} />
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0"
          role="dialog" aria-modal="true" aria-label="تأیید عملیات"
          onClick={(e) => e.target === e.currentTarget && !actionPending && setConfirmAction(null)}
        >
          <div className="rounded-[20px] p-6 w-full max-w-sm space-y-4" dir="rtl"
               style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.15)' }}>
            <h2 className="text-base font-bold" style={{ color: '#DCF0F5' }}>تأیید عملیات</h2>
            <p className="text-sm" style={{ color: '#4A6E8A' }}>{DIALOG_COPY[confirmAction.action]?.question}</p>
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

function StatCard({ icon, iconColor, value, label }) {
  return (
    <div className="rounded-[20px] p-4 transition-all"
         style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}
         onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.28)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
         onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
           style={{ background: `${iconColor}15`, border: `1px solid ${iconColor}25` }}>
        <svg className="w-4 h-4" style={{ color: iconColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
      </div>
      <div className="text-2xl font-black" style={{ color: '#DCF0F5' }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: '#4A6E8A' }}>{label}</div>
    </div>
  )
}

function QuickCard({ label, iconColor, icon, onClick }) {
  return (
    <button onClick={onClick}
            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 cursor-pointer"
            style={{ background: 'rgba(0,212,200,0.03)', border: '1px solid rgba(0,212,200,0.07)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.28)'; e.currentTarget.style.transform = 'translateY(-3px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
           style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}30` }}>
        <svg className="w-5 h-5" style={{ color: iconColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
      </div>
      <span className="text-xs font-bold" style={{ color: '#DCF0F5' }}>{label}</span>
    </button>
  )
}
