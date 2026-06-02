import { useState } from 'react'
import { useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import { useDoctor } from '../../hooks/useDoctors'
import { useBookAppointment } from '../../hooks/useBookAppointment'
import { useInitiatePayment } from '../../hooks/useInitiatePayment'
import { formatFee } from '../../utils/date'

// Step machine: idle → booking → redirecting → error
const STEPS = { IDLE: 'idle', BOOKING: 'booking', REDIRECTING: 'redirecting', ERROR: 'error' }

export default function BookAppointmentPage() {
  const { id: doctorId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [step, setStep] = useState(STEPS.IDLE)
  const [trackingCode, setTrackingCode] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)

  const { data: doctor, isLoading: doctorLoading } = useDoctor(doctorId)
  const { book } = useBookAppointment()
  const { initiate } = useInitiatePayment()

  // Guard: must arrive with slot selection from DoctorDetailPage
  if (!state?.date || !state?.slot) {
    return <Navigate to={`/doctors/${doctorId}`} replace />
  }

  const { date, slot } = state
  const isBusy = step === STEPS.BOOKING || step === STEPS.REDIRECTING

  async function handleConfirm() {
    if (isBusy) return
    setErrorMsg(null)
    setStep(STEPS.BOOKING)

    let appointment
    try {
      appointment = await book({ doctorId: Number(doctorId), date, startTime: slot })
    } catch (err) {
      const data = err?.response?.data
      let msg = 'خطا در ثبت نوبت'
      if (data?.error) {
        if (
          data.error.includes('قبلاً رزرو') ||
          data.error.includes('اسلات')
        ) {
          msg = 'این زمان دیگر در دسترس نیست. لطفاً اسلات دیگری انتخاب کنید.'
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

  return (
    <MainLayout>
      <div className="max-w-sm space-y-6">
        <button
          onClick={() => navigate(`/doctors/${doctorId}`)}
          className="text-blue-500 text-sm hover:text-blue-700"
          disabled={isBusy}
        >
          ← بازگشت
        </button>

        <h1 className="text-xl font-bold text-gray-800">تأیید و پرداخت</h1>

        {/* Summary card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {doctorLoading ? (
            <Spinner />
          ) : doctor ? (
            <div className="space-y-1">
              <p className="font-bold text-gray-800">{doctor.full_name}</p>
              <p className="text-sm text-blue-600">{doctor.specialty}</p>
            </div>
          ) : null}

          <div className="border-t border-gray-50 pt-4 space-y-3 text-sm">
            <Row label="تاریخ" value={<span dir="ltr">{date}</span>} />
            <Row label="ساعت" value={<span className="font-mono">{slot}</span>} />
            {doctor && (
              <Row
                label="حق ویزیت"
                value={
                  <span className="font-medium text-green-700">
                    {formatFee(doctor.consultation_fee)}
                  </span>
                }
              />
            )}
            {doctor && (
              <Row label="مدت ویزیت" value={`${doctor.visit_duration} دقیقه`} />
            )}
          </div>
        </div>

        {/* Error */}
        {step === STEPS.ERROR && errorMsg && (
          <div className="space-y-3">
            <ErrorMessage message={errorMsg} />
            {errorMsg.includes('دسترس نیست') && (
              <button
                onClick={() => navigate(`/doctors/${doctorId}`)}
                className="w-full border border-blue-200 text-blue-600 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors"
              >
                انتخاب اسلات دیگر
              </button>
            )}
          </div>
        )}

        {/* Redirecting state — show tracking code before browser navigates away */}
        {step === STEPS.REDIRECTING && trackingCode && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm space-y-2">
            <p className="text-blue-700 font-medium">در حال اتصال به درگاه پرداخت…</p>
            <p className="text-gray-600">
              کد پیگیری:{' '}
              <span className="font-mono font-bold text-gray-800">{trackingCode}</span>
            </p>
            <p className="text-xs text-gray-400">این کد را یادداشت کنید</p>
          </div>
        )}

        {/* Confirm button */}
        {step !== STEPS.REDIRECTING && (
          <button
            onClick={handleConfirm}
            disabled={isBusy || doctorLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {step === STEPS.BOOKING ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                در حال ثبت نوبت…
              </>
            ) : step === STEPS.ERROR ? (
              'تلاش مجدد'
            ) : (
              'تأیید و پرداخت'
            )}
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
