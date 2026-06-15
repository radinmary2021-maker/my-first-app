import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import Button from '../../components/Button'
import Badge, { APPOINTMENT_STATUS_LABEL } from '../../components/Badge'
import { CalendarIcon, ClockIcon, RefreshCwIcon } from '../../components/Icon'
import { notify } from '../../utils/toast'
import { useMyAppointments, useCancelAppointment } from '../../hooks/useAppointments'
import { toJalali } from '../../utils/jalali'

const ACTIVE_STATUSES = ['pending_payment', 'confirmed']

export default function MyAppointmentsPage() {
  const navigate = useNavigate()
  const { data: appointments, isLoading, isError, refetch } = useMyAppointments()
  const { mutate: cancel, isPending: cancelling } = useCancelAppointment()

  const [confirmId, setConfirmId] = useState(null)

  function handleCancelRequest(id) {
    setConfirmId(id)
  }

  function handleCancelConfirm() {
    cancel(confirmId, {
      onSuccess: () => {
        setConfirmId(null)
        notify('نوبت با موفقیت لغو شد.', 'success')
      },
      onError: (err) => {
        setConfirmId(null)
        notify(err?.response?.data?.error || 'خطا در لغو نوبت', 'error')
      },
    })
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            نوبت‌های من
          </h1>
          <Button variant="ghost" size="sm" onClick={() => navigate('/providers')}>
            رزرو نوبت جدید
          </Button>
        </div>

        {isLoading && <Spinner className="py-20" />}

        {isError && (
          <div className="space-y-3">
            <ErrorMessage message="خطا در دریافت نوبت‌ها. لطفاً دوباره تلاش کنید." />
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCwIcon size={14} />
              تلاش مجدد
            </Button>
          </div>
        )}

        {!isLoading && !isError && appointments?.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'var(--color-brand-light)' }}
            >
              <CalendarIcon size={32} style={{ color: 'var(--color-brand)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                هنوز نوبتی ثبت نکرده‌اید
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                اولین نوبت خود را رزرو کنید
              </p>
            </div>
            <Button onClick={() => navigate('/providers')}>
              رزرو نوبت
            </Button>
          </div>
        )}

        {!isLoading && !isError && appointments?.length > 0 && (
          <div className="space-y-4">
            {appointments.map((appt) => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                onCancel={() => handleCancelRequest(appt.id)}
                cancelling={cancelling && confirmId === appt.id}
              />
            ))}
          </div>
        )}
      </div>

      {confirmId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div className="card p-6 w-full max-w-sm space-y-4" dir="rtl">
            <h2 id="cancel-dialog-title" className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
              لغو نوبت
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              آیا مطمئن هستید که می‌خواهید این نوبت را لغو کنید؟ این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                fullWidth
                loading={cancelling}
                onClick={handleCancelConfirm}
              >
                بله، لغو کن
              </Button>
              <Button
                variant="ghost"
                fullWidth
                disabled={cancelling}
                onClick={() => setConfirmId(null)}
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

function AppointmentCard({ appt, onCancel, cancelling }) {
  const isActive = ACTIVE_STATUSES.includes(appt.status)

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {appt.provider_name || appt.doctor_name}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-brand)' }}>
            {appt.provider_category || appt.provider_specialty || appt.doctor_specialty}
          </p>
        </div>
        <Badge variant={appt.status}>
          {APPOINTMENT_STATUS_LABEL[appt.status] ?? appt.status}
        </Badge>
      </div>

      <div
        className="grid grid-cols-2 gap-2 text-sm border-t pt-3"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
      >
        <div>
          <span
            className="text-xs flex items-center gap-1 mb-0.5"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <CalendarIcon size={11} />
            تاریخ
          </span>
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {toJalali(appt.date)}
          </span>
        </div>
        <div>
          <span
            className="text-xs flex items-center gap-1 mb-0.5"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <ClockIcon size={11} />
            ساعت
          </span>
          <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {appt.start_time}
          </span>
        </div>
        <div>
          <span
            className="text-xs block mb-0.5"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            کد پیگیری
          </span>
          <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>
            {appt.tracking_code}
          </span>
        </div>
      </div>

      {isActive && (
        <Button
          variant="danger"
          fullWidth
          loading={cancelling}
          onClick={onCancel}
        >
          لغو نوبت
        </Button>
      )}
    </div>
  )
}
