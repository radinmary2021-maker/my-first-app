import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import DatePicker from '../../components/DatePicker'
import SlotPicker from '../../components/SlotPicker'
import DoctorAvatar from '../../components/DoctorAvatar'
import { useProvider, useProviderSlots, useProviderServices } from '../../hooks/useDoctors'
import { formatFee } from '../../utils/date'

export default function DoctorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate]       = useState(null)
  const [selectedSlot, setSelectedSlot]       = useState(null)

  const { data: provider,  isLoading: providerLoading,  isError: providerError  } = useProvider(id)
  const { data: services,  isLoading: servicesLoading                            } = useProviderServices(id)
  const { data: slotsData, isLoading: slotsLoading,     isError: slotsError, refetch: refetchSlots } = useProviderSlots(id, selectedDate)

  function handleDateSelect(date) {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  function handleProceed() {
    navigate(`/book/${id}`, {
      state: {
        providerId:  Number(id),
        date:        selectedDate,
        slot:        selectedSlot,
        serviceId:   selectedService?.id   ?? null,
        serviceName: selectedService?.name ?? null,
        servicePrice: selectedService?.price ?? null,
      },
    })
  }

  if (providerLoading) {
    return <MainLayout><Spinner className="py-20" /></MainLayout>
  }

  if (providerError || !provider) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <button onClick={() => navigate('/providers')} className="text-cyan-500 text-sm hover:text-cyan-700">
            ← بازگشت به لیست ارائه‌دهندگان
          </button>
          <ErrorMessage message="ارائه‌دهنده مورد نظر یافت نشد" />
        </div>
      </MainLayout>
    )
  }

  const hasServices     = services && services.length > 0
  const serviceRequired = hasServices
  const canPickDate     = !serviceRequired || selectedService !== null

  return (
    <MainLayout>
      <div className="space-y-8 max-w-2xl">

        {/* Back */}
        <button onClick={() => navigate('/providers')} className="text-cyan-500 text-sm hover:text-cyan-700">
          ← بازگشت به لیست
        </button>

        {/* Provider info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-4">
            <DoctorAvatar name={provider.business_name || provider.full_name} size={72} />
            <div>
              <h1 className="text-xl font-bold text-gray-800">{provider.business_name || provider.full_name}</h1>
              <p className="text-sm text-cyan-600 mt-0.5">{provider.category_display || provider.specialty}</p>
              <span className="inline-block mt-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">
                فعال
              </span>
            </div>
          </div>

          {provider.bio && (
            <p className="text-sm text-gray-600 leading-relaxed">{provider.bio}</p>
          )}

          {!hasServices && (
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-2 border-t border-gray-50">
              <span>⏱ مدت نوبت: {provider.slot_duration} دقیقه</span>
              <span>💰 هزینه خدمت: {formatFee(provider.service_fee)}</span>
            </div>
          )}
        </div>

        {/* Step 1 — Service selection */}
        {servicesLoading && <Spinner />}

        {hasServices && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">۱. انتخاب خدمت</h2>
            <div className="grid gap-3">
              {services.map((svc) => {
                const active = selectedService?.id === svc.id
                return (
                  <button
                    key={svc.id}
                    onClick={() => {
                      setSelectedService(svc)
                      setSelectedDate(null)
                      setSelectedSlot(null)
                    }}
                    className={`w-full text-right p-4 rounded-xl border transition-colors ${
                      active
                        ? 'border-cyan-400 bg-cyan-50'
                        : 'border-gray-100 hover:border-cyan-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-gray-800">{svc.name}</p>
                        {svc.description && (
                          <p className="text-xs text-gray-500 line-clamp-1">{svc.description}</p>
                        )}
                      </div>
                      <div className="text-left shrink-0 space-y-0.5">
                        <p className="text-xs text-gray-500 font-mono">{svc.duration_minutes} دقیقه</p>
                        {Number(svc.price) > 0 && (
                          <p className="text-xs text-emerald-700 font-medium">
                            {Number(svc.price).toLocaleString('fa-IR')} تومان
                          </p>
                        )}
                      </div>
                    </div>
                    {active && (
                      <span className="inline-block mt-2 text-xs text-cyan-600 font-medium">✓ انتخاب شد</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 2 — guidance when service is required but not yet selected */}
        {serviceRequired && !canPickDate && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
            </svg>
            <p className="text-sm text-amber-700">
              برای ادامه، ابتدا خدمت مورد نظر را از لیست بالا انتخاب کنید.
            </p>
          </div>
        )}

        {/* Step 2 — Date picker */}
        {canPickDate && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {hasServices && (
              <h2 className="text-sm font-semibold text-gray-700 mb-4">۲. انتخاب تاریخ</h2>
            )}
            <DatePicker
              availableWeekdays={provider.available_weekdays ?? []}
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
            />
          </div>
        )}

        {/* Step 3 — Slot picker */}
        {selectedDate && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {hasServices && (
              <h2 className="text-sm font-semibold text-gray-700 mb-4">۳. انتخاب ساعت</h2>
            )}
            {slotsError ? (
              <div className="space-y-3">
                <ErrorMessage message="خطا در دریافت زمان‌های خالی" />
                <button
                  onClick={() => refetchSlots()}
                  className="text-sm bg-cyan-50 text-cyan-700 border border-cyan-100 px-4 py-2 rounded-lg hover:bg-cyan-100 transition-colors font-medium"
                >
                  تلاش مجدد
                </button>
              </div>
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

        {/* Proceed */}
        {selectedSlot && (
          <div className="bg-cyan-50 rounded-2xl border border-cyan-100 p-4 space-y-3">
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                <span className="text-gray-500">ارائه‌دهنده: </span>
                <span className="font-medium">{provider.business_name || provider.full_name}</span>
              </p>
              {selectedService && (
                <p>
                  <span className="text-gray-500">خدمت: </span>
                  <span className="font-medium">{selectedService.name}</span>
                </p>
              )}
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
              className="w-full bg-cyan-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-cyan-600 transition-colors"
            >
              ادامه و رزرو نوبت
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
