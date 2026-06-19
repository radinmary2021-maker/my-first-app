import { useState } from 'react'
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import { useProvider } from '../../hooks/useDoctors'
import { useBookAppointment } from '../../hooks/useBookAppointment'
import { useInitiatePayment } from '../../hooks/useInitiatePayment'
import { formatFee } from '../../utils/date'
import { toJalali } from '../../utils/jalali'

const STEPS_ENUM = { IDLE: 'idle', BOOKING: 'booking', REDIRECTING: 'redirecting', ERROR: 'error' }

export default function BookAppointmentPage() {
  const { id: providerId } = useParams()
  const { state }          = useLocation()
  const navigate           = useNavigate()

  const [step, setStep]             = useState(STEPS_ENUM.IDLE)
  const [trackingCode, setTrackingCode] = useState(null)
  const [errorMsg, setErrorMsg]     = useState(null)

  const { data: provider, isLoading: providerLoading } = useProvider(providerId)
  const { book }    = useBookAppointment()
  const { initiate } = useInitiatePayment()

  if (!state?.date || !state?.slot) {
    return <Navigate to={`/providers/${providerId}`} replace />
  }

  const { date, slot, serviceId = null, serviceName = null, servicePrice = null } = state
  const isBusy = step === STEPS_ENUM.BOOKING || step === STEPS_ENUM.REDIRECTING

  async function handleConfirm() {
    if (isBusy) return
    setErrorMsg(null)
    setStep(STEPS_ENUM.BOOKING)

    let appointment
    try {
      appointment = await book({ providerId: Number(providerId), serviceId, date, startTime: slot })
    } catch (err) {
      const data = err?.response?.data
      let msg = 'خطا در ثبت نوبت'
      if (data?.error) {
        msg = data.error.includes('قبلاً رزرو') || data.error.includes('اسلات')
          ? 'این زمان دیگر در دسترس نیست. لطفاً زمان دیگری انتخاب کنید.'
          : data.error
      }
      setErrorMsg(msg)
      setStep(STEPS_ENUM.ERROR)
      return
    }

    setTrackingCode(appointment.tracking_code)
    setStep(STEPS_ENUM.REDIRECTING)

    try {
      const { gate_url } = await initiate(appointment.id)
      window.location.href = gate_url
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || 'خطا در اتصال به درگاه پرداخت')
      setStep(STEPS_ENUM.ERROR)
    }
  }

  const displayFee = servicePrice != null && Number(servicePrice) > 0
    ? `${Number(servicePrice).toLocaleString('fa-IR')} تومان`
    : provider ? formatFee(provider.service_fee) : null

  const providerName = provider?.business_name || provider?.full_name || ''

  const currentStep = step === STEPS_ENUM.IDLE || step === STEPS_ENUM.ERROR ? 3
    : step === STEPS_ENUM.BOOKING ? 3
    : 3

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">

          {/* Progress steps */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <StepDot n={1} label="خدمت" done />
            <div className="h-0.5 flex-1 bg-cyan-200 -mt-5" />
            <StepDot n={2} label="زمان" done />
            <div className="h-0.5 flex-1 bg-cyan-200 -mt-5" />
            <StepDot n={3} label="تأیید" active />
          </div>

          <div className="px-6 pb-6">
            <h1 className="text-lg font-black text-slate-900 mb-1">تأیید نوبت</h1>
            <p className="text-sm text-slate-400 mb-5">جزئیات نوبت خود را بررسی کنید</p>

            {/* Business summary */}
            {providerLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : provider && (
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-4 mb-5">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl shrink-0"
                     style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}>
                  📋
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{providerName}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{provider.category_display || provider.specialty}</div>
                </div>
              </div>
            )}

            {/* Booking details */}
            <div className="space-y-3 mb-6">
              {serviceName && (
                <DetailRow icon={<><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>}
                           iconColor="text-cyan-500" bg="bg-cyan-50/50 border-cyan-100"
                           label="خدمت" value={serviceName} />
              )}
              <DetailRow icon={<><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /><path d="M8 2v4M16 2v4" /></>}
                         iconColor="text-emerald-500" bg="bg-emerald-50/50 border-emerald-100"
                         label="تاریخ" value={toJalali(date)} />
              <DetailRow icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
                         iconColor="text-amber-500" bg="bg-amber-50/50 border-amber-100"
                         label="ساعت" value={slot} />
            </div>

            {/* Price summary */}
            {displayFee && (
              <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="font-bold text-slate-700">مبلغ قابل پرداخت</span>
                  <span className="text-lg font-black text-cyan-600">{displayFee}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {step === STEPS_ENUM.ERROR && errorMsg && (
              <div className="mb-4 space-y-3">
                <ErrorMessage message={errorMsg} />
                {errorMsg.includes('دسترس نیست') && (
                  <button onClick={() => navigate(`/providers/${providerId}`)}
                          className="w-full border border-cyan-200 text-cyan-600 py-2.5 rounded-xl text-sm hover:bg-cyan-50 transition-colors">
                    انتخاب زمان دیگر
                  </button>
                )}
              </div>
            )}

            {/* Redirecting */}
            {step === STEPS_ENUM.REDIRECTING && trackingCode && (
              <div className="bg-cyan-50 border border-cyan-100 rounded-2xl p-4 text-sm space-y-2 mb-4">
                <p className="text-cyan-700 font-medium">در حال اتصال به درگاه پرداخت…</p>
                <p className="text-slate-600">کد پیگیری: <span className="font-mono font-bold text-slate-800">{trackingCode}</span></p>
              </div>
            )}

            {/* CTA */}
            {step !== STEPS_ENUM.REDIRECTING && (
              <button
                onClick={handleConfirm}
                disabled={isBusy || providerLoading}
                className="w-full text-white font-black py-4 rounded-2xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-cyan-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
              >
                {step === STEPS_ENUM.BOOKING ? (
                  <Spinner size="xs" light />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                    {step === STEPS_ENUM.ERROR ? 'تلاش مجدد' : 'پرداخت و تأیید نهایی'}
                  </>
                )}
              </button>
            )}
            <p className="text-center text-xs text-slate-400 mt-3">پرداخت امن با درگاه زرین‌پال</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function StepDot({ n, label, done, active }) {
  const cls = done || active
    ? 'bg-gradient-to-br from-cyan-600 to-cyan-400 text-white'
    : 'bg-slate-100 text-slate-400'
  return (
    <div className={`flex flex-col items-center gap-1.5 flex-1 ${active ? 'scale-110' : ''}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${cls} transition-transform`}
           style={done || active ? { background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' } : {}}>
        {n}
      </div>
      <span className={`text-[10px] font-bold ${done || active ? 'text-cyan-700' : 'text-slate-400'}`}>{label}</span>
    </div>
  )
}

function DetailRow({ icon, iconColor, bg, label, value }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${bg}`}>
      <div className="flex items-center gap-2.5">
        <svg className={`w-4 h-4 ${iconColor}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  )
}
