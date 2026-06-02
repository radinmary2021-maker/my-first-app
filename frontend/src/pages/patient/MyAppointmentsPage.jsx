import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import { notify } from '../../utils/toast'
import { useMyAppointments, useCancelAppointment } from '../../hooks/useAppointments'

const STATUS_LABEL = {
  pending_payment: 'در انتظار پرداخت',
  confirmed: 'تأیید شده',
  cancelled: 'لغو شده',
  completed: 'انجام شده',
  no_show: 'غیبت',
}

const STATUS_CLASS = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-800',
  no_show: 'bg-red-100 text-red-700',
}

const ACTIVE_STATUSES = ['pending_payment', 'confirmed']

export default function MyAppointmentsPage() {
  const navigate = useNavigate()
  const { data: appointments, isLoading, isError } = useMyAppointments()
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
          <h1 className="text-xl font-bold text-gray-800">نوبت‌های من</h1>
          <button
            onClick={() => navigate('/doctors')}
            className="text-sm text-blue-500 hover:text-blue-700"
          >
            رزرو نوبت جدید
          </button>
        </div>

        {isLoading && <Spinner className="py-20" />}

        {isError && (
          <ErrorMessage message="خطا در دریافت نوبت‌ها. لطفاً صفحه را بازخوانی کنید." />
        )}

        {!isLoading && !isError && appointments?.length === 0 && (
          <div className="text-center py-20 text-gray-400 space-y-3">
            <p className="text-4xl">📅</p>
            <p className="text-sm">هنوز نوبتی ثبت نکرده‌اید</p>
            <button
              onClick={() => navigate('/doctors')}
              className="text-blue-500 text-sm hover:text-blue-700"
            >
              رزرو اولین نوبت
            </button>
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

      {/* Confirmation dialog */}
      {confirmId && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4" dir="rtl">
            <h2 id="cancel-dialog-title" className="text-base font-bold text-gray-800">لغو نوبت</h2>
            <p className="text-sm text-gray-600">
              آیا مطمئن هستید که می‌خواهید این نوبت را لغو کنید؟ این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelConfirm}
                disabled={cancelling}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelling ? 'در حال لغو...' : 'بله، لغو کن'}
              </button>
              <button
                onClick={() => setConfirmId(null)}
                disabled={cancelling}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                انصراف
              </button>
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-800">{appt.doctor_name}</p>
          <p className="text-sm text-blue-600">{appt.doctor_specialty}</p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_CLASS[appt.status] ?? 'bg-gray-100 text-gray-500'}`}
        >
          {STATUS_LABEL[appt.status] ?? appt.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 border-t border-gray-50 pt-3">
        <div>
          <span className="text-gray-400 text-xs block mb-0.5">تاریخ</span>
          <span dir="ltr" className="font-medium">{appt.date}</span>
        </div>
        <div>
          <span className="text-gray-400 text-xs block mb-0.5">ساعت</span>
          <span className="font-mono font-medium">{appt.start_time}</span>
        </div>
        <div>
          <span className="text-gray-400 text-xs block mb-0.5">کد پیگیری</span>
          <span className="font-mono text-gray-800">{appt.tracking_code}</span>
        </div>
      </div>

      {isActive && (
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="w-full border border-red-200 text-red-600 text-sm py-2 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          لغو نوبت
        </button>
      )}
    </div>
  )
}
