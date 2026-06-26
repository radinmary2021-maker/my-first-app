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

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="rounded-[20px] overflow-hidden" style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.07)' }}>

          {/* Progress steps */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <StepDot n={1} label="خدمت" done />
            <div className="h-0.5 flex-1 -mt-5" style={{ background: 'rgba(0,212,200,0.2)' }} />
            <StepDot n={2} label="زمان" done />
            <div className="h-0.5 flex-1 -mt-5" style={{ background: 'rgba(0,212,200,0.2)' }} />
            <StepDot n={3} label="تأیید" active />
          </div>

          <div className="px-6 pb-6">
            <h1 className="text-lg font-black mb-1 cyan-text">تأیید نوبت</h1>
            <p className="text-sm mb-5" style={{ color: '#6B8FAD' }}>جزئیات نوبت خود را بررسی کنید</p>

            {/* Business summary */}
            {providerLoading ? (
              <div className="flex justify-center py-4"><Spinner /></div>
            ) : provider && (
              <div className="flex items-center gap-3 rounded-2xl p-4 mb-5" style={{ background: 'rgba(0,212,200,0.04)', border: '1px solid rgba(0,212,200,0.07)' }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl shrink-0"
                     style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', color: 'white' }}>
                  📋
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: '#E8F4FF' }}>{providerName}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#6B8FAD' }}>{provider.category_display || provider.specialty}</div>
                </div>
              </div>
            )}

            {/* Booking details */}
            <div className="space-y-3 mb-6">
              {serviceName && (
                <DetailRow icon={<><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>}
                           iconColor="#00D4C8" label="خدمت" value={serviceName} />
              )}
              <DetailRow icon={<><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /><path d="M8 2v4M16 2v4" /></>}
                         iconColor="#39FF14" label="تاریخ" value={toJalali(date)} />
              <DetailRow icon={<><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>}
                         iconColor="#FF6B2B" label="ساعت" value={slot} />
            </div>

            {/* Price summary */}
            {displayFee && (
              <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(0,212,200,0.04)', border: '1px solid rgba(0,212,200,0.07)' }}>
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="font-bold" style={{ color: '#E8F4FF' }}>مبلغ قابل پرداخت</span>
                  <span className="text-lg font-black" style={{ color: '#00D4C8' }}>{displayFee}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {step === STEPS_ENUM.ERROR && errorMsg && (
              <div className="mb-4 space-y-3">
                <ErrorMessage message={errorMsg} />
                {errorMsg.includes('دسترس نیست') && (
                  <button onClick={() => navigate(`/providers/${providerId}`)}
                          className="w-full py-2.5 rounded-xl text-sm transition-colors font-bold"
                          style={{ border: '1px solid rgba(0,212,200,0.3)', color: '#00D4C8' }}>
                    انتخاب زمان دیگر
                  </button>
                )}
              </div>
            )}

            {/* Redirecting */}
            {step === STEPS_ENUM.REDIRECTING && trackingCode && (
              <div className="rounded-2xl p-4 text-sm space-y-2 mb-4" style={{ background: 'rgba(0,212,200,0.06)', border: '1px solid rgba(0,212,200,0.15)' }}>
                <p className="font-medium" style={{ color: '#00D4C8' }}>در حال اتصال به درگاه پرداخت…</p>
                <p style={{ color: '#6B8FAD' }}>کد پیگیری: <span className="font-mono font-bold" style={{ color: '#E8F4FF' }}>{trackingCode}</span></p>
              </div>
            )}

            {/* CTA */}
            {step !== STEPS_ENUM.REDIRECTING && (
              <button
                onClick={handleConfirm}
                disabled={isBusy || providerLoading}
                className="w-full text-white font-black py-4 rounded-2xl text-sm transition-all
                           flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
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
            <p className="text-center text-xs mt-3" style={{ color: '#6B8FAD' }}>پرداخت امن با درگاه زرین‌پال</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function StepDot({ n, label, done, active }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 flex-1 ${active ? 'scale-110' : ''}`}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-transform"
           style={done || active
             ? { background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', color: 'white', boxShadow: '0 0 12px rgba(0,212,200,0.3)' }
             : { background: '#243548', color: '#6B8FAD' }
           }>
        {n}
      </div>
      <span className="text-[10px] font-bold" style={{ color: done || active ? '#00D4C8' : '#6B8FAD' }}>{label}</span>
    </div>
  )
}

function DetailRow({ icon, iconColor, label, value }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(0,212,200,0.03)', border: '1px solid rgba(0,212,200,0.07)' }}>
      <div className="flex items-center gap-2.5">
        <svg className="w-4 h-4" style={{ color: iconColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
        <span className="text-sm" style={{ color: '#6B8FAD' }}>{label}</span>
      </div>
      <span className="text-sm font-bold" style={{ color: '#E8F4FF' }}>{value}</span>
    </div>
  )
}
