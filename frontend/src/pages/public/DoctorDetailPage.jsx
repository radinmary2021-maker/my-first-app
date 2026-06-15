import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import DatePicker from '../../components/DatePicker'
import SlotPicker from '../../components/SlotPicker'
import DoctorAvatar from '../../components/DoctorAvatar'
import Badge from '../../components/Badge'
import { CATEGORY_ICON, BriefcaseIcon, ClockIcon, AlertCircleIcon, ChevronRightIcon } from '../../components/Icon'
import { useProvider, useProviderSlots, useProviderServices, useProviderReviews } from '../../hooks/useDoctors'
import { formatFee } from '../../utils/date'
import { toJalali } from '../../utils/jalali'

const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z'

function StarDisplay({ value, size = 'sm' }) {
  const full = Math.floor(value ?? 0)
  const cls  = size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'
  return (
    <div className="flex gap-px">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor"
             className={`${cls} ${i <= full ? 'text-amber-400' : 'text-gray-200'}`}>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  )
}

export default function DoctorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [selectedService, setSelectedService] = useState(null)
  const [selectedDate, setSelectedDate]       = useState(null)
  const [selectedSlot, setSelectedSlot]       = useState(null)

  const [reviewPage, setReviewPage] = useState(1)

  const { data: provider,  isLoading: providerLoading,  isError: providerError  } = useProvider(id)
  const { data: services,  isLoading: servicesLoading                            } = useProviderServices(id)
  const { data: slotsData, isLoading: slotsLoading,     isError: slotsError, refetch: refetchSlots } = useProviderSlots(id, selectedDate, selectedService?.id)
  const { data: reviewsData } = useProviderReviews(id, reviewPage)

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
  const isAvailable     = (provider.available_weekdays ?? []).length > 0
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
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {isAvailable
                  ? <Badge variant="success">فعال</Badge>
                  : <Badge variant="neutral">هنوز فعال نشده</Badge>
                }
                {provider.average_rating != null && provider.reviews_count > 0 && (
                  <div className="flex items-center gap-1">
                    <StarDisplay value={provider.average_rating} size="lg" />
                    <span className="text-xs font-semibold text-amber-600">
                      {provider.average_rating}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      ({provider.reviews_count} نظر)
                    </span>
                  </div>
                )}
              </div>
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

        {/* No working hours banner */}
        {!isAvailable && (
          <div className="rounded-2xl p-5 flex items-start gap-3"
               style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <AlertCircleIcon size={20} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0, marginTop: 1 }} />
            <div className="space-y-1">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                این ارائه‌دهنده هنوز ساعات کاری خود را تنظیم نکرده است.
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                در حال حاضر امکان رزرو نوبت وجود ندارد. لطفاً بعداً مراجعه کنید یا ارائه‌دهنده دیگری انتخاب کنید.
              </p>
            </div>
          </div>
        )}

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
        {isAvailable && serviceRequired && !canPickDate && (
          <div className="rounded-2xl p-4 flex items-center gap-3"
               style={{ backgroundColor: 'var(--color-warning-bg)', border: '1px solid rgba(245,158,11,.2)' }}>
            <AlertCircleIcon size={20} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
            <p className="text-sm" style={{ color: '#92400E' }}>
              برای ادامه، ابتدا خدمت مورد نظر را از لیست بالا انتخاب کنید.
            </p>
          </div>
        )}

        {/* Step 2 — Date picker */}
        {isAvailable && canPickDate && (
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
        {isAvailable && selectedDate && (
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
        {isAvailable && selectedSlot && (
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
        {/* Reviews section */}
        {reviewsData && (reviewsData.results ?? reviewsData).length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              نظرات کاربران
            </h2>
            <div className="space-y-4">
              {(reviewsData.results ?? reviewsData).map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0 space-y-1"
                     style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <StarDisplay value={review.rating} />
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {review.customer_display}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {toJalali(review.created_at?.slice(0, 10))}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {reviewsData.next && (
              <button
                onClick={() => setReviewPage((p) => p + 1)}
                className="w-full text-sm py-2 rounded-xl border transition-colors hover:bg-gray-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-brand)' }}
              >
                نمایش بیشتر
              </button>
            )}
          </div>
        )}

      </div>
    </MainLayout>
  )
}
