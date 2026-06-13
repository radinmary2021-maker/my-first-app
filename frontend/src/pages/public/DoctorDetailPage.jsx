import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import DatePicker from '../../components/DatePicker'
import SlotPicker from '../../components/SlotPicker'
import DoctorAvatar from '../../components/DoctorAvatar'
import { CATEGORY_ICON, BriefcaseIcon, ClockIcon, AlertCircleIcon, ChevronRightIcon } from '../../components/Icon'
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
  const { data: slotsData, isLoading: slotsLoading,     isError: slotsError, refetch: refetchSlots } = useProviderSlots(id, selectedDate, selectedService?.id)

  function handleDateSelect(date) {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  function handleProceed() {
    navigate(`/book/${id}`, {
      state: {
        providerId:   Number(id),
        date:         selectedDate,
        slot:         selectedSlot,
        serviceId:    selectedService?.id    ?? null,
        serviceName:  selectedService?.name  ?? null,
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
          <button
            onClick={() => navigate('/providers')}
            className="flex items-center gap-1 text-sm"
            style={{ color: 'var(--color-brand)' }}
          >
            <ChevronRightIcon size={14} />
            بازگشت به لیست ارائه‌دهندگان
          </button>
          <ErrorMessage message="ارائه‌دهنده مورد نظر یافت نشد" />
        </div>
      </MainLayout>
    )
  }

  const CategoryIcon    = CATEGORY_ICON[provider.category] ?? BriefcaseIcon
  const hasServices     = services && services.length > 0
  const serviceRequired = hasServices
  const canPickDate     = !serviceRequired || selectedService !== null

  return (
    <MainLayout>
      <div className="space-y-8 max-w-2xl">

        {/* Back */}
        <button
          onClick={() => navigate('/providers')}
          className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--color-brand)' }}
        >
          <ChevronRightIcon size={14} />
          بازگشت به لیست
        </button>

        {/* Provider info card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-4">
            <DoctorAvatar name={provider.business_name || provider.full_name} size={72} />
            <div>
              <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                {provider.business_name || provider.full_name}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5"
                   style={{ color: 'var(--color-brand)' }}>
                <CategoryIcon size={14} />
                <p className="text-sm font-medium">
                  {provider.category_display || provider.specialty}
                </p>
              </div>
              <span className="inline-block mt-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">
                فعال
              </span>
            </div>
          </div>

          {provider.bio && (
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {provider.bio}
            </p>
          )}

          {!hasServices && (
            <div className="flex flex-wrap gap-4 text-sm border-t pt-3"
                 style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' }}>
              <span className="flex items-center gap-1.5">
                <ClockIcon size={14} style={{ color: 'var(--color-brand)' }} />
                مدت نوبت: {provider.slot_duration} دقیقه
              </span>
              <span className="flex items-center gap-1.5">
                <span style={{ color: 'var(--color-brand)' }}>💰</span>
                هزینه خدمت: {formatFee(provider.service_fee)}
              </span>
            </div>
          )}
        </div>

        {/* Step 1 — Service selection */}
        {servicesLoading && <Spinner />}

        {hasServices && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              ۱. انتخاب خدمت
            </h2>
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
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {svc.name}
                        </p>
                        {svc.description && (
                          <p className="text-xs line-clamp-1" style={{ color: 'var(--color-text-tertiary)' }}>
                            {svc.description}
                          </p>
                        )}
                      </div>
                      <div className="text-left shrink-0 space-y-0.5">
                        <p className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                          {svc.duration_minutes} دقیقه
                        </p>
                        {Number(svc.price) > 0 && (
                          <p className="text-xs font-medium text-emerald-700">
                            {Number(svc.price).toLocaleString('fa-IR')} تومان
                          </p>
                        )}
                      </div>
                    </div>
                    {active && (
                      <span className="inline-block mt-2 text-xs font-medium"
                            style={{ color: 'var(--color-brand)' }}>
                        ✓ انتخاب شد
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Guidance: service required but not selected */}
        {serviceRequired && !canPickDate && (
          <div className="rounded-2xl p-4 flex items-center gap-3"
               style={{ backgroundColor: 'var(--color-warning-bg)', border: '1px solid rgba(245,158,11,.2)' }}>
            <AlertCircleIcon size={20} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
            <p className="text-sm" style={{ color: '#92400E' }}>
              برای ادامه، ابتدا خدمت مورد نظر را از لیست بالا انتخاب کنید.
            </p>
          </div>
        )}

        {/* Step 2 — Date picker */}
        {canPickDate && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {hasServices && (
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                ۲. انتخاب تاریخ
              </h2>
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
              <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                ۳. انتخاب ساعت
              </h2>
            )}
            {!hasServices ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-tertiary)' }}>
                این ارائه‌دهنده هنوز خدمتی تعریف نکرده است.
              </p>
            ) : slotsError ? (
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

        {/* Proceed to booking */}
        {selectedSlot && (
          <div className="rounded-2xl border p-4 space-y-3"
               style={{ backgroundColor: 'var(--color-brand-light)', borderColor: 'rgba(6,182,212,.2)' }}>
            <div className="text-sm space-y-1" style={{ color: 'var(--color-text-primary)' }}>
              <p>
                <span style={{ color: 'var(--color-text-secondary)' }}>ارائه‌دهنده: </span>
                <span className="font-medium">{provider.business_name || provider.full_name}</span>
              </p>
              {selectedService && (
                <p>
                  <span style={{ color: 'var(--color-text-secondary)' }}>خدمت: </span>
                  <span className="font-medium">{selectedService.name}</span>
                </p>
              )}
              <p>
                <span style={{ color: 'var(--color-text-secondary)' }}>تاریخ: </span>
                <span className="font-medium" dir="ltr">{selectedDate}</span>
              </p>
              <p>
                <span style={{ color: 'var(--color-text-secondary)' }}>ساعت: </span>
                <span className="font-medium font-mono">{selectedSlot}</span>
              </p>
            </div>
            <button
              onClick={handleProceed}
              className="w-full text-white py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--color-brand)' }}
            >
              ادامه و رزرو نوبت
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
