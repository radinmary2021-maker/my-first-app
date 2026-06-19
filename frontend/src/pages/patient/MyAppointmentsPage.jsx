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
  confirmed:       { badge: 'bg-cyan-50 text-cyan-600', border: 'border-cyan-100 border-2', opacity: '' },
  pending_payment: { badge: 'bg-amber-50 text-amber-600', border: 'border-amber-100', opacity: '' },
  pending:         { badge: 'bg-amber-50 text-amber-600', border: 'border-slate-100', opacity: '' },
  completed:       { badge: 'bg-emerald-50 text-emerald-600', border: 'border-slate-100', opacity: 'opacity-75' },
  cancelled:       { badge: 'bg-rose-50 text-rose-500', border: 'border-slate-100', opacity: 'opacity-60' },
  no_show:         { badge: 'bg-slate-100 text-slate-500', border: 'border-slate-100', opacity: 'opacity-60' },
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
          <h1 className="text-xl font-black text-slate-900 mb-1">نوبت‌های من</h1>
          <p className="text-sm text-slate-400">مدیریت و پیگیری نوبت‌های رزروشده</p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-xs font-bold px-4 py-2 rounded-full shrink-0 transition-colors ${
                filter === f.value
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-cyan-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <div className="py-20 flex justify-center"><Spinner /></div>}
        {isError && <ErrorMessage message="خطا در دریافت نوبت‌ها. لطفاً دوباره تلاش کنید." />}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /></svg>
            </div>
            <p className="font-medium text-slate-700">هنوز نوبتی ثبت نکرده‌اید</p>
            <button onClick={() => navigate('/providers')}
                    className="text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-sm shadow-cyan-200 hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}>
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

              return (
                <div key={appt.id} className={`bg-white rounded-2xl ${style.border} overflow-hidden ${style.opacity} hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200`}>
                  <div className="flex items-center gap-4 p-4">
                    <div className="text-center shrink-0 w-16">
                      <div className={`text-xs font-bold ${isCancelled ? 'text-slate-400' : isActive ? 'text-cyan-500' : 'text-slate-400'}`}>
                        {toJalali(appt.date)?.split(' ')[1] || ''}
                      </div>
                      <div className={`text-2xl font-black ${isCancelled ? 'text-slate-400 line-through' : isActive ? 'text-cyan-700' : 'text-slate-500'}`}>
                        {toJalali(appt.date)?.split(' ')[0] || ''}
                      </div>
                    </div>
                    <div className="w-px h-12 bg-slate-100" />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold ${isCancelled ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                        {appt.provider_name || appt.doctor_name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {appt.service_name || appt.tracking_code} · {appt.start_time}
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${style.badge}`}>
                      {APPOINTMENT_STATUS_LABEL[appt.status] ?? appt.status}
                    </span>
                  </div>

                  {/* Actions */}
                  {(isActive || canReview) && (
                    <div className="flex border-t border-slate-50">
                      {isActive && (
                        <button onClick={() => setConfirmId(appt.id)}
                                className="flex-1 text-xs font-bold text-slate-500 py-3 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
                          لغو نوبت
                        </button>
                      )}
                      {canReview && (
                        <button onClick={() => { setReviewAppt(appt); setRating(0); setComment('') }}
                                className="flex-1 text-xs font-bold text-amber-600 py-3 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1.5">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d={STAR_PATH.replace(/20/g, '24')} /></svg>
                          ثبت نظر
                        </button>
                      )}
                    </div>
                  )}

                  {appt.status === 'completed' && appt.has_review && (
                    <div className="px-4 pb-3">
                      <p className="text-xs text-slate-400">✓ نظر شما ثبت شده است</p>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="cancel-dialog-title">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4" dir="rtl">
            <h2 id="cancel-dialog-title" className="text-base font-bold text-slate-800">لغو نوبت</h2>
            <p className="text-sm text-slate-500">آیا مطمئن هستید که می‌خواهید این نوبت را لغو کنید؟</p>
            <div className="flex gap-3">
              <Button variant="danger" fullWidth loading={cancelling} onClick={handleCancelConfirm}>بله، لغو کن</Button>
              <Button variant="ghost" fullWidth disabled={cancelling} onClick={() => setConfirmId(null)}>انصراف</Button>
            </div>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewAppt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-5" dir="rtl">
            <div>
              <h2 id="review-dialog-title" className="text-base font-bold text-slate-800">ثبت نظر</h2>
              <p className="text-sm mt-0.5 text-slate-400">{reviewAppt.provider_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-600">امتیاز شما</p>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">نظر (اختیاری)</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3}
                        placeholder="تجربه خود را بنویسید..."
                        className="w-full rounded-xl border-2 px-3 py-2 text-sm resize-none outline-none focus:border-cyan-400 transition-colors"
                        style={{ borderColor: '#E0F7FA', background: '#F0FDFF' }} />
              <p className="text-xs text-slate-400 text-left">{comment.length}/۵۰۰</p>
            </div>
            <div className="flex gap-3">
              <Button fullWidth loading={submitting} onClick={handleReviewSubmit} disabled={!rating || submitting}>ثبت نظر</Button>
              <Button variant="ghost" fullWidth disabled={submitting} onClick={() => setReviewAppt(null)}>انصراف</Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
