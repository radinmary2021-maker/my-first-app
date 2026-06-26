import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import Button from '../../components/Button'
import { APPOINTMENT_STATUS_LABEL } from '../../components/Badge'
import { notify } from '../../utils/toast'
import { useMyAppointments, useCancelAppointment, useSubmitReview } from '../../hooks/useAppointments'
import { toJalali } from '../../utils/jalali'

const ACTIVE_STATUSES = ['pending_payment', 'confirmed']
const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

const FILTERS = [
  { value: '', label: 'همه' },
  { value: 'upcoming', label: 'پیش‌رو' },
  { value: 'completed', label: 'تکمیل‌شده' },
  { value: 'cancelled', label: 'لغوشده' },
]

const STATUS_STYLE = {
  confirmed:       { bg: 'rgba(57,255,20,0.15)', color: '#39FF14', borderColor: 'rgba(57,255,20,0.2)' },
  pending_payment: { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', borderColor: 'rgba(245,158,11,0.15)' },
  pending:         { bg: 'rgba(245,158,11,0.1)', color: '#F59E0B', borderColor: 'rgba(0,212,200,0.07)' },
  completed:       { bg: 'rgba(0,212,200,0.1)', color: '#00D4C8', borderColor: 'rgba(0,212,200,0.07)' },
  cancelled:       { bg: 'rgba(239,68,68,0.1)', color: '#EF4444', borderColor: 'rgba(0,212,200,0.07)' },
  no_show:         { bg: 'rgba(74,110,138,0.15)', color: '#6B8FAD', borderColor: 'rgba(0,212,200,0.07)' },
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  const display = hovered || value
  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(star)} onMouseEnter={() => setHovered(star)}
                className="focus:outline-none" aria-label={`${star} ستاره`}>
          <svg viewBox="0 0 20 20" fill="currentColor"
               className={`w-8 h-8 transition-colors`}
               style={{ color: star <= display ? '#F59E0B' : '#243548' }}>
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
  const [reviewAppt, setReviewAppt]   = useState(null)
  const [rating, setRating]           = useState(0)
  const [comment, setComment]         = useState('')
  const [filter, setFilter]           = useState('')

  function handleCancelConfirm() {
    cancel(confirmId, {
      onSuccess: () => { setConfirmId(null); notify('نوبت با موفقیت لغو شد.', 'success') },
      onError:   (err) => { setConfirmId(null); notify(err?.response?.data?.error || 'خطا در لغو نوبت', 'error') },
    })
  }

  function handleReviewSubmit() {
    if (!rating) { notify('لطفاً یک امتیاز انتخاب کنید.', 'error'); return }
    submitReview(
      { appointmentId: reviewAppt.id, data: { rating, comment } },
      {
        onSuccess: () => { setReviewAppt(null); notify('نظر شما با موفقیت ثبت شد.', 'success') },
        onError: (err) => { notify(err?.response?.data?.error || 'خطا در ثبت نظر', 'error') },
      }
    )
  }

  const filtered = (appointments ?? []).filter((a) => {
    if (!filter) return true
    if (filter === 'upcoming') return ACTIVE_STATUSES.includes(a.status)
    if (filter === 'completed') return a.status === 'completed'
    if (filter === 'cancelled') return a.status === 'cancelled' || a.status === 'no_show'
    return true
  })

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-black mb-1"
              style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            نوبت‌های من
          </h1>
          <p className="text-sm" style={{ color: '#6B8FAD' }}>مدیریت و پیگیری نوبت‌های رزروشده</p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="text-xs font-bold px-4 py-2 rounded-full shrink-0 transition-colors"
              style={filter === f.value
                ? { background: 'rgba(0,212,200,0.15)', color: '#00D4C8', border: '1px solid rgba(0,212,200,0.3)' }
                : { background: 'transparent', color: '#6B8FAD', border: '1px solid rgba(0,212,200,0.12)' }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <div className="py-20 flex justify-center"><Spinner /></div>}
        {isError && <ErrorMessage message="خطا در دریافت نوبت‌ها. لطفاً دوباره تلاش کنید." />}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                 style={{ background: 'rgba(0,212,200,0.1)' }}>
              <svg className="w-8 h-8" style={{ color: '#00D4C8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /></svg>
            </div>
            <p className="font-medium" style={{ color: '#E8F4FF' }}>هنوز نوبتی ثبت نکرده‌اید</p>
            <button onClick={() => navigate('/providers')}
                    className="text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}>
              رزرو نوبت
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((appt) => {
              const style = STATUS_STYLE[appt.status] || STATUS_STYLE.pending
              const isActive = ACTIVE_STATUSES.includes(appt.status)
              const canReview = appt.status === 'completed' && !appt.has_review
              const isCancelled = appt.status === 'cancelled' || appt.status === 'no_show'
              const isCompleted = appt.status === 'completed'

              return (
                <div key={appt.id}
                     className="rounded-2xl overflow-hidden hover:-translate-y-0.5 transition-all duration-200"
                     style={{
                       background: '#1C2A3E',
                       border: `1px solid ${isActive ? style.borderColor : 'rgba(0,212,200,0.07)'}`,
                       opacity: isCancelled ? 0.6 : isCompleted ? 0.75 : 1,
                     }}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="text-center shrink-0 w-16">
                      <div className="text-xs font-bold" style={{ color: isCancelled ? '#6B8FAD' : isActive ? '#00D4C8' : '#6B8FAD' }}>
                        {toJalali(appt.date)?.split(' ')[1] || ''}
                      </div>
                      <div className="text-2xl font-black" style={{
                        color: isCancelled ? '#6B8FAD' : isActive ? '#00D4C8' : '#6B8FAD',
                        textDecoration: isCancelled ? 'line-through' : 'none',
                      }}>
                        {toJalali(appt.date)?.split(' ')[0] || ''}
                      </div>
                    </div>
                    <div className="w-px h-12" style={{ background: 'rgba(0,212,200,0.07)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{
                        color: isCancelled ? '#6B8FAD' : '#E8F4FF',
                        textDecoration: isCancelled ? 'line-through' : 'none',
                      }}>
                        {appt.provider_name || appt.doctor_name}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: '#6B8FAD' }}>
                        {appt.service_name || appt.tracking_code} · {appt.start_time}
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full shrink-0"
                          style={{ background: style.bg, color: style.color }}>
                      {APPOINTMENT_STATUS_LABEL[appt.status] ?? appt.status}
                    </span>
                  </div>

                  {/* Actions */}
                  {(isActive || canReview) && (
                    <div className="flex" style={{ borderTop: '1px solid rgba(0,212,200,0.07)' }}>
                      {isActive && (
                        <button onClick={() => setConfirmId(appt.id)}
                                className="flex-1 text-xs font-bold py-3 hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                                style={{ color: '#6B8FAD' }}>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                          لغو نوبت
                        </button>
                      )}
                      {canReview && (
                        <button onClick={() => { setReviewAppt(appt); setRating(0); setComment('') }}
                                className="flex-1 text-xs font-bold py-3 hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
                                style={{ color: '#F59E0B' }}>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d={STAR_PATH.replace(/20/g, '24')} /></svg>
                          ثبت نظر
                        </button>
                      )}
                    </div>
                  )}

                  {appt.status === 'completed' && appt.has_review && (
                    <div className="px-4 pb-3">
                      <p className="text-xs" style={{ color: '#6B8FAD' }}>✓ نظر شما ثبت شده است</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cancel dialog */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title">
          <div className="rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4" dir="rtl"
               style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.07)' }}>
            <h2 id="cancel-dialog-title" className="text-base font-bold" style={{ color: '#E8F4FF' }}>لغو نوبت</h2>
            <p className="text-sm" style={{ color: '#6B8FAD' }}>آیا مطمئن هستید که می‌خواهید این نوبت را لغو کنید؟</p>
            <div className="flex gap-3">
              <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancelConfirm}>بله، لغو کن</Button>
              <Button variant="ghost" fullWidth disabled={cancelling} onClick={() => setConfirmId(null)}>انصراف</Button>
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewAppt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
          <div className="rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-5" dir="rtl"
               style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.07)' }}>
            <div>
              <h2 id="review-dialog-title" className="text-base font-bold" style={{ color: '#E8F4FF' }}>ثبت نظر</h2>
              <p className="text-sm mt-0.5" style={{ color: '#6B8FAD' }}>{reviewAppt.provider_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium" style={{ color: '#6B8FAD' }}>امتیاز شما</p>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium" style={{ color: '#6B8FAD' }}>نظر (اختیاری)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3}
                        placeholder="تجربه خود را بنویسید..."
                        className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none transition-colors"
                        style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.18)', color: '#E8F4FF' }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(0,212,200,0.45)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(0,212,200,0.18)'} />
              <p className="text-xs text-left" style={{ color: '#6B8FAD' }}>{comment.length}/۵۰۰</p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 text-white font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
                onClick={handleReviewSubmit}
                disabled={!rating || submitting}
              >
                {submitting ? <Spinner size="xs" light /> : 'ثبت نظر'}
              </button>
              <button
                className="flex-1 font-bold py-3 rounded-xl text-sm transition-colors"
                style={{ border: '1px solid rgba(0,212,200,0.3)', color: '#00D4C8', background: 'transparent' }}
                disabled={submitting}
                onClick={() => setReviewAppt(null)}
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
