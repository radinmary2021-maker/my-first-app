import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import DatePicker from '../../components/DatePicker'
import SlotPicker from '../../components/SlotPicker'
import { useDoctor, useDoctorSlots } from '../../hooks/useDoctors'
import { formatFee } from '../../utils/date'

export default function DoctorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)

  const { data: doctor, isLoading, isError } = useDoctor(id)
  const {
    data: slotsData,
    isLoading: slotsLoading,
    isError: slotsError,
  } = useDoctorSlots(id, selectedDate)

  function handleDateSelect(date) {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  function handleProceed() {
    navigate(`/book/${id}`, {
      state: { doctorId: Number(id), date: selectedDate, slot: selectedSlot },
    })
  }

  if (isLoading) {
    return (
      <MainLayout>
        <Spinner className="py-20" />
      </MainLayout>
    )
  }

  if (isError || !doctor) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <button
            onClick={() => navigate('/doctors')}
            className="text-blue-500 text-sm hover:text-blue-700"
          >
            ← بازگشت به لیست پزشکان
          </button>
          <ErrorMessage message="پزشک مورد نظر یافت نشد" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-2xl">
        {/* Back */}
        <button
          onClick={() => navigate('/doctors')}
          className="text-blue-500 text-sm hover:text-blue-700"
        >
          ← بازگشت به لیست پزشکان
        </button>

        {/* Doctor info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-800">{doctor.full_name}</h1>
              <p className="text-sm text-blue-600 mt-0.5">{doctor.specialty}</p>
            </div>
          </div>

          {doctor.bio && (
            <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t border-gray-50">
            <span>⏱ مدت ویزیت: {doctor.visit_duration} دقیقه</span>
            <span>💰 حق ویزیت: {formatFee(doctor.consultation_fee)}</span>
          </div>
        </div>

        {/* Date picker */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <DatePicker
            availableWeekdays={doctor.available_weekdays ?? []}
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
          />
        </div>

        {/* Slot picker — shown only after date selected */}
        {selectedDate && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {slotsError ? (
              <ErrorMessage message="خطا در دریافت اسلات‌ها" />
            ) : (
              <SlotPicker
                slots={slotsData?.slots}
                isLoading={slotsLoading}
                selectedSlot={selectedSlot}
                onSelect={setSelectedSlot}
              />
            )}
          </div>
        )}

        {/* Proceed button */}
        {selectedSlot && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4 space-y-3">
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                <span className="text-gray-500">پزشک: </span>
                <span className="font-medium">{doctor.full_name}</span>
              </p>
              <p>
                <span className="text-gray-500">تاریخ: </span>
                <span className="font-medium" dir="ltr">{selectedDate}</span>
              </p>
              <p>
                <span className="text-gray-500">ساعت: </span>
                <span className="font-medium font-mono">{selectedSlot}</span>
              </p>
            </div>
            <button
              onClick={handleProceed}
              className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              ادامه و رزرو نوبت
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
