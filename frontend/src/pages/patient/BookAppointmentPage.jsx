import { useState } from 'react'
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import { useProvider } from '../../hooks/useDoctors'
import { useBookAppointment } from '../../hooks/useBookAppointment'
import { useInitiatePayment } from '../../hooks/useInitiatePayment'
import { formatFee } from '../../utils/date'

const STEPS = { IDLE: 'idle', BOOKING: 'booking', REDIRECTING: 'redirecting', ERROR: 'error' }

export default function BookAppointmentPage() {
  const { id: providerId } = useParams()
  const { state }          = useLocation()
  const navigate           = useNavigate()

  const [step, setStep]             = useState(STEPS.IDLE)
  const [trackingCode, setTrackingCode] = useState(null)
  const [errorMsg, setErrorMsg]     = useState(null)

  const { data: provider, isLoading: providerLoading } = useProvider(providerId)
  const { book }    = useBookAppointment()
  const { initiate } = useInitiatePayment()

  // Guard: must arrive from DoctorDetailPage with date + slot
  if (!state?.date || !state?.slot) {
    return <Navigate to={`/providers/${providerId}`} replace />
  }

  const { date, slot, serviceId = null, serviceName = null, servicePrice = null } = state
  const isBusy = step === STEPS.BOOKING || step === STEPS.REDIRECTING

  async function handleConfirm() {
    if (isBusy) return
    setErrorMsg(null)
    setStep(STEPS.BOOKING)

    let appointment
    try {
      appointment = await book({
        providerId: Number(providerId),
        serviceId,
        date,
        startTime: slot,
      })
    } catch (err) {
      const data = err?.response?.data
      let msg = 'خطا در ثبت نوبت'
      if (data?.error) {
        if (data.error.includes('قبلاً رزرو') || data.error.includes('اسلات')) {
          msg = 'این زمان دیگر در دسترس نیست. لطفاً زمان دیگری انتخاب کنید.'
        } else {
          msg = data.error
        }
      }
      setErrorMsg(msg)
      setStep(STEPS.ERROR)
      return
    }

    setTrackingCode(appointment.tracking_code)
    setStep(STEPS.REDIRECTING)

    try {
      const { gate_url } = await initiate(appointment.id)
      window.location.href = gate_url
    } catch (err) {
      const data = err?.response?.data
      setErrorMsg(data?.error || 'خطا در اتصال به درگاه پرداخت')
      setStep(STEPS.ERROR)
    }
  }

  // Determine displayed fee: service price takes priority, fallback to provider fee
  const displayFee = servicePrice != null && Number(servicePrice) > 0
    ? `${Number(servicePrice).toLocaleString('fa-IR')} تومان`
    : provider ? formatFee(provider.service_fee) : null

  return (
    <MainLayout>
      <div className="max-w-sm space-y-6">
        <button
          onClick={() => navigate(`/providers/${providerId}`)}
          className="text-cyan-500 text-sm hover:text-cyan-700"
          disabled={isBusy}
        >
          ← بازگشت
        </button>

        <h1 className="text-xl font-bold text-gray-800">تأیید و پرداخت</h1>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {providerLoading ? (
            <Spinner />
          ) : provider ? (
            <div className="space-y-1">
              <p className="font-bold text-gray-800">{provider.business_name || provider.full_name}</p>
              <p className="text-sm text-cyan-600">{provider.category_display || provider.specialty}</p>
            </div>
          ) : null}

          <div className="border-t border-gray-50 pt-4 space-y-3 text-sm">
            {serviceName && (
              <Row
                label="خدمت"
                value={
                  <span className="bg-cyan-50 text-cyan-700 text-xs px-2 py-0.5 rounded-full font-medium">
                    {serviceName}
                  </span>
                }
              />
            )}
            <Row label="تاریخ" value={<span dir="ltr">{date}</span>} />
            <Row label="ساعت"  value={<span className="font-mono">{slot}</span>} />
            {displayFee && (
              <Row
                label="هزینه خدمت"
                value={<span className="font-medium text-green-700">{displayFee}</span>}
              />
            )}
            {provider && (
              <Row label="مدت نوبت" value={`${provider.slot_duration} دقیقه`} />
            )}
          </div>
        </div>

        {step === STEPS.ERROR && errorMsg && (
          <div className="space-y-3">
            <ErrorMessage message={errorMsg} />
            {errorMsg.includes('دسترس نیست') && (
              <button
                onClick={() => navigate(`/providers/${providerId}`)}
                className="w-full border border-cyan-200 text-cyan-600 py-2.5 rounded-xl text-sm hover:bg-cyan-50 transition-colors"
              >
                انتخاب زمان دیگر
              </button>
            )}
          </div>
        )}

        {step === STEPS.REDIRECTING && trackingCode && (
          <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 text-sm space-y-2">
            <p className="text-cyan-700 font-medium">در حال اتصال به درگاه پرداخت…</p>
            <p className="text-gray-600">
              کد پیگیری: <span className="font-mono font-bold text-gray-800">{trackingCode}</span>
            </p>
            <p className="text-xs text-gray-400">این کد را یادداشت کنید</p>
          </div>
        )}

        {step !== STEPS.REDIRECTING && (
          <button
            onClick={handleConfirm}
            disabled={isBusy || providerLoading}
            className="w-full bg-cyan-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {step === STEPS.BOOKING ? (
              <><Spinner size="sm" light />در حال ثبت نوبت…</>
            ) : step === STEPS.ERROR ? 'تلاش مجدد' : 'تأیید و پرداخت'}
          </button>
        )}
      </div>
    </MainLayout>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800">{value}</span>
    </div>
  )
}
