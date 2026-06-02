import { useLocation, useNavigate, Navigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'

export default function BookAppointmentPage() {
  const { state } = useLocation()
  const navigate = useNavigate()

  // Guard: must arrive with booking state from DoctorDetailPage
  if (!state?.doctorId || !state?.date || !state?.slot) {
    return <Navigate to="/doctors" replace />
  }

  return (
    <MainLayout>
      <div className="max-w-sm space-y-6">
        <h1 className="text-xl font-bold text-gray-800">تأیید رزرو</h1>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3 text-sm text-gray-700">
          <div className="flex justify-between">
            <span className="text-gray-500">شناسه پزشک</span>
            <span className="font-medium">{state.doctorId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">تاریخ</span>
            <span className="font-medium font-mono" dir="ltr">{state.date}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">ساعت</span>
            <span className="font-medium font-mono">{state.slot}</span>
          </div>
        </div>

        {/* Sprint Frontend 3 — POST /api/appointments/ */}
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700">
          ثبت رزرو واقعی در Sprint Frontend 3 پیاده‌سازی می‌شود
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
        >
          بازگشت
        </button>
      </div>
    </MainLayout>
  )
}
