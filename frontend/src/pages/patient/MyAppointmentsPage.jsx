import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import Button from '../../components/Button'
import Badge, { APPOINTMENT_STATUS_LABEL } from '../../components/Badge'
import { CalendarIcon, ClockIcon, RefreshCwIcon } from '../../components/Icon'
import { notify } from '../../utils/toast'
import { useMyAppointments, useCancelAppointment, useSubmitReview } from '../../hooks/useAppointments'
import { toJalali } from '../../utils/jalali'

const ACTIVE_STATUSES = ['pending_payment', 'confirmed']
const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          className="focus:outline-none"
          aria-label={`${star} ستاره`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor"
               className={`w-8 h-8 transition-colors ${star <= display ? 'text-amber-400' : 'text-gray-200'}`}>
            <path d={STAR_PATH} />
          </svg>
        </button>
      ))}
    </div>
  )
}

export default function MyAppointmentsPage() {
  const navigate = useNavigate()
  const { data: appointments, isLoading, isError, refetch } = useMyAppointments()
  const { mutate: cancel, isPending: cancelling } = useCancelAppointment()
  const { mutate: submitReview, isPending: submitting } = useSubmitReview()

  const [confirmId, setConfirmId]     = useState(null)
  const [reviewAppt, setReviewAppt]   = useState(null)   // appointment being reviewed
  const [rating, setRating]           = useState(0)
  const [comment, setComment]         = useState('')

  function handleCancelRequest(id) { setConfirmId(id) }

  function handleCancelConfirm() {
    cancel(confirmId, {
      onSuccess: () => { setConfirmId(null); notify('نوبت با موفقیت لغو شد.', 'success') },
      onError:   (err) => { setConfirmId(null); notify(err?.response?.data?.error || 'خطا در لغو نوبت', 'error') },
    })
  }

  function openReviewModal(appt) {
    setReviewAppt(appt)
    setRating(0)
    setComment('')
  }

  function handleReviewSubmit() {
    if (!rating) { notify('لطفاً یک امتیاز انتخاب کنید.', 'error'); return }
    submitReview(
      { appointmentId: reviewAppt.id, data: { rating, comment } },
      {
        onSuccess: () => {
          setReviewAppt(null)
          notify('نظر شما با موفقیت ثبت شد.', 'success')
        },
        onError: (err) => {
          notify(err?.response?.data?.error || 'خطا در ثبت نظر', 'error')
        },
      }
    )
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
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                 style={{ backgroundColor: 'var(--color-brand-light)' }}>
              <CalendarIcon size={32} style={{ color: 'var(--color-brand)' }} />
            </div>
            <div>
              <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>هنوز نوبتی ثبت نکرده‌اید</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>اولین نوبت خود را رزرو کنید</p>
            </div>
            <Button onClick={() => navigate('/providers')}>رزرو نوبت</Button>
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
                onReview={() => openReviewModal(appt)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Cancel dialog */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
             role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title">
          <div className="card p-6 w-full max-w-sm space-y-4" dir="rtl">
            <h2 id="cancel-dialog-title" className="text-base font-bold"
                style={{ color: 'var(--color-text-primary)' }}>
              لغو نوبت
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              آیا مطمئن هستید که می‌خواهید این نوبت را لغو کنید؟ این عمل قابل بازگشت نیست.
            </p>
            <div className="flex gap-3">
              <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancelConfirm}>
                بله، لغو کن
              </Button>
              <Button variant="ghost" fullWidth disabled={cancelling} onClick={() => setConfirmId(null)}>
                انصراف
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewAppt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
             role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
          <div className="card p-6 w-full max-w-sm space-y-5" dir="rtl">
            <div>
              <h2 id="review-dialog-title" className="text-base font-bold"
                  style={{ color: 'var(--color-text-primary)' }}>
                ثبت نظر
              </h2>
              <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
                {reviewAppt.provider_name}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                امتیاز شما
              </p>
              <StarPicker value={rating} onChange={setRating} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                نظر (اختیاری)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="تجربه خود را بنویسید..."
                className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  focusRingColor: 'var(--color-brand)',
                }}
              />
              <p className="text-xs text-gray-400 text-left">{comment.length}/۵۰۰</p>
            </div>

            <div className="flex gap-3">
              <Button fullWidth loading={submitting} onClick={handleReviewSubmit}
                      disabled={!rating || submitting}>
                ثبت نظر
              </Button>
              <Button variant="ghost" fullWidth disabled={submitting}
                      onClick={() => setReviewAppt(null)}>
                انصراف
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}

function AppointmentCard({ appt, onCancel, cancelling, onReview }) {
  const isActive    = ACTIVE_STATUSES.includes(appt.status)
  const canReview   = appt.status === 'completed' && !appt.has_review

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

      <div className="grid grid-cols-2 gap-2 text-sm border-t pt-3"
           style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
        <div>
          <span className="text-xs flex items-center gap-1 mb-0.5"
                style={{ color: 'var(--color-text-tertiary)' }}>
            <CalendarIcon size={11} />
            تاریخ
          </span>
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {toJalali(appt.date)}
          </span>
        </div>
        <div>
          <span className="text-xs flex items-center gap-1 mb-0.5"
                style={{ color: 'var(--color-text-tertiary)' }}>
            <ClockIcon size={11} />
            ساعت
          </span>
          <span className="font-mono font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {appt.start_time}
          </span>
        </div>
        <div>
          <span className="text-xs block mb-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            کد پیگیری
          </span>
          <span className="font-mono" style={{ color: 'var(--color-text-primary)' }}>
            {appt.tracking_code}
          </span>
        </div>
      </div>

      {isActive && (
        <Button variant="danger" fullWidth loading={cancelling} onClick={onCancel}>
          لغو نوبت
        </Button>
      )}

      {canReview && (
        <Button variant="secondary" fullWidth onClick={onReview}>
          ثبت نظر
        </Button>
      )}

      {appt.status === 'completed' && appt.has_review && (
        <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          ✓ نظر شما ثبت شده است
        </p>
      )}
    </div>
  )
}
