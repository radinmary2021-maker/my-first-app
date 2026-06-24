import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import DatePicker from '../../components/DatePicker'
import SlotPicker from '../../components/SlotPicker'
import ImageAvatar from '../../components/ImageAvatar'
import { useProvider, useProviders, useProviderSlots, useProviderServices, useProviderReviews } from '../../hooks/useDoctors'
import { formatFee } from '../../utils/date'
import { toJalali } from '../../utils/jalali'
import { notify } from '../../utils/toast'

function ServiceRow({ svc, active, onSelect }) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors group ${
        active ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
          active ? 'bg-cyan-100' : 'bg-slate-50'
        }`}>
          ✂️
        </div>
        <div>
          <div className={`text-sm font-semibold ${active ? 'text-cyan-700' : 'text-slate-800'}`}>{svc.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{svc.duration_minutes} دقیقه</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {Number(svc.price) > 0 && (
          <span className="text-sm font-bold text-slate-700">{Number(svc.price).toLocaleString('fa-IR')}ت</span>
        )}
        <button className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
          active ? 'bg-cyan-500 text-white' : 'opacity-0 group-hover:opacity-100 bg-cyan-500 text-white'
        }`}>
          {active ? '✓ انتخاب شد' : 'انتخاب'}
        </button>
      </div>
    </div>
  )
}

function ProviderServiceGroup({ provider: sib, selectedProviderId, selectedServiceId, onSelectService }) {
  const { data: svcList, isLoading } = useProviderServices(sib.id)
  const isThisProvider = selectedProviderId === sib.id

  return (
    <div className={`rounded-2xl border p-4 transition-colors ${isThisProvider ? 'border-cyan-200 bg-cyan-50/30' : 'border-slate-100'}`}>
      <div className="flex items-center gap-3 mb-3">
        <ImageAvatar src={sib.logo} alt={sib.full_name} fallbackText={sib.full_name} size="w-11 h-11" shape="rounded-xl" />
        <div>
          <div className={`text-sm font-bold ${isThisProvider ? 'text-cyan-700' : 'text-slate-800'}`}>{sib.full_name}</div>
          <div className="text-xs text-slate-400">{sib.specialty}</div>
        </div>
      </div>
      {isLoading && <Spinner />}
      {svcList && svcList.length > 0 && (
        <div className="space-y-1.5">
          {svcList.map((svc) => {
            const active = isThisProvider && selectedServiceId === svc.id
            return <ServiceRow key={svc.id} svc={svc} active={active} onSelect={() => onSelectService(svc)} />
          })}
        </div>
      )}
      {svcList && svcList.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-3">خدمتی تعریف نشده.</p>
      )}
    </div>
  )
}

export default function ProviderDetailPage() {
  const { id: paramId, slug: paramSlug } = useParams()
  const lookup = paramId || paramSlug
  const navigate = useNavigate()
  const { state: locationState } = useLocation()
  const preselectedServiceId = locationState?.preselectedServiceId ?? null

  const [selectedProvider, setSelectedProvider] = useState(null)
  const [selectedService, setSelectedService]   = useState(null)
  const [selectedDate, setSelectedDate]         = useState(null)
  const [selectedSlot, setSelectedSlot]         = useState(null)
  const [reviewPage, setReviewPage]             = useState(1)
  const [activeTab, setActiveTab]               = useState('services')

  const { data: provider,  isLoading: providerLoading,  isError: providerError  } = useProvider(lookup)
  const { data: allProviders } = useProviders()

  const siblings = (allProviders ?? []).filter((p) => provider && p.business_id === provider.business_id)
  const hasMultipleProviders = siblings.length > 1
  const activeProvider = selectedProvider ?? provider
  const providerId = activeProvider?.id

  const { data: services,  isLoading: servicesLoading } = useProviderServices(providerId)

  useEffect(() => {
    if (!preselectedServiceId || !services?.length || selectedService) return
    const match = services.find((s) => s.id === preselectedServiceId)
    if (match) setSelectedService(match)
  }, [services, preselectedServiceId])

  function handleSelectProvider(p) {
    setSelectedProvider(p)
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedSlot(null)
  }

  const { data: slotsData, isLoading: slotsLoading, isError: slotsError, refetch: refetchSlots } = useProviderSlots(providerId, selectedDate, selectedService?.id)
  const { data: reviewsData } = useProviderReviews(providerId, reviewPage)

  function handleDateSelect(date) {
    setSelectedDate(date)
    setSelectedSlot(null)
  }

  function handleShare() {
    if (!provider?.business_slug && !provider?.latin_slug) return
    const slug = provider.latin_slug || provider.business_slug
    const shareUrl = `${window.location.origin}/book/${slug}`
    if (navigator.share) {
      navigator.share({ title: provider.business_name || provider.full_name, url: shareUrl }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => notify('لینک کپی شد', 'success'))
        .catch(() => notify('خطا در کپی لینک', 'error'))
    }
  }

  function handleProceed() {
    navigate(`/booking/${activeProvider.id}`, {
      state: {
        providerId:   activeProvider.id,
        date:         selectedDate,
        slot:         selectedSlot,
        serviceId:    selectedService?.id    ?? null,
        serviceName:  selectedService?.name  ?? null,
        servicePrice: selectedService?.price ?? null,
      },
    })
  }

  if (providerLoading) {
    return <MainLayout><div className="flex justify-center py-20"><Spinner /></div></MainLayout>
  }

  if (providerError || !provider) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <button onClick={() => navigate('/providers')} className="flex items-center gap-1 text-sm text-cyan-600 hover:text-cyan-700">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
            بازگشت به لیست
          </button>
          <ErrorMessage message="ارائه‌دهنده مورد نظر یافت نشد" />
        </div>
      </MainLayout>
    )
  }

  const isAvailable     = (provider.available_weekdays ?? []).length > 0
  const hasServices     = services && services.length > 0
  const serviceRequired = hasServices
  const canPickDate     = !serviceRequired || selectedService !== null
  const providerName    = provider.business_name || provider.full_name
  const staffName       = provider.full_name && provider.full_name !== provider.business_name ? provider.full_name : null
  const providerSlug    = provider.latin_slug || provider.business_slug
  const category        = provider.category_display || provider.specialty
  const hasRating       = provider.average_rating != null && provider.reviews_count > 0
  const reviews         = reviewsData?.results ?? reviewsData ?? []

  const seoDescription = provider.bio
    ? `${providerName} — ${provider.bio.slice(0, 120)}`
    : `رزرو آنلاین نوبت از ${providerName}. ${category || ''} در نوبتیک.`

  const providerJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: providerName,
    description: seoDescription,
    url: providerSlug ? `https://nobatiic.ir/book/${providerSlug}` : `https://nobatiic.ir/providers/${provider.id}`,
    ...(hasRating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: provider.average_rating, reviewCount: provider.reviews_count } } : {}),
  }

  return (
    <MainLayout fullWidth>
      <SEOHead
        title={providerName}
        description={seoDescription}
        canonical={providerSlug ? `/book/${providerSlug}` : `/providers/${provider.id}`}
        ogType="business.business"
        jsonLd={providerJsonLd}
      />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate-400">
          <button onClick={() => navigate('/')} className="hover:text-cyan-600 transition-colors">خانه</button>
          <svg className="w-3 h-3 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          <button onClick={() => navigate('/providers')} className="hover:text-cyan-600 transition-colors">{category || 'کسب‌وکارها'}</button>
          <svg className="w-3 h-3 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          <span className="text-slate-600 font-medium">{providerName}</span>
        </div>
      </div>

      {/* Cover */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <ImageAvatar src={provider.logo} alt={providerName} fallbackText={providerName} size="w-full h-48 sm:h-72" shape="rounded-2xl" blurBg />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left: Info + Tabs */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Provider header */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <ImageAvatar src={provider.logo} alt={providerName} fallbackText={providerName} size="w-16 h-16" shape="rounded-2xl" className="shadow-md shadow-cyan-200" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl font-black text-slate-900">{providerName}</h1>
                      {isAvailable
                        ? <span className="bg-cyan-50 text-cyan-600 text-xs font-bold px-2.5 py-1 rounded-full border border-cyan-100">فعال</span>
                        : <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2.5 py-1 rounded-full">غیرفعال</span>
                      }
                    </div>
                    <p className="text-slate-500 text-sm">{category}</p>
                    {staffName && (
                      <p className="text-sm text-slate-600 mt-1">با مدیریت: <span className="font-semibold text-slate-700">{staffName}</span></p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {hasRating && (
                        <div className="flex items-center gap-1">
                          <span className="text-amber-400">{'★'.repeat(Math.floor(provider.average_rating))}{'☆'.repeat(5 - Math.floor(provider.average_rating))}</span>
                          <span className="text-sm font-bold text-slate-700">{provider.average_rating}</span>
                          <span className="text-xs text-slate-400">({provider.reviews_count} نظر)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleShare}
                    className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-cyan-500 hover:border-cyan-200 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>
                  </button>
                </div>
              </div>

              {/* Quick info pills */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-50">
                {provider.slot_duration && (
                  <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs px-3 py-1.5 rounded-full">
                    <svg className="w-3.5 h-3.5 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    مدت نوبت: {provider.slot_duration} دقیقه
                  </div>
                )}
                {provider.service_fee && (
                  <div className="flex items-center gap-1.5 bg-slate-50 text-slate-600 text-xs px-3 py-1.5 rounded-full">
                    💰 {formatFee(provider.service_fee)}
                  </div>
                )}
              </div>

              {provider.bio && (
                <p className="text-sm text-slate-500 leading-7 mt-3">{provider.bio}</p>
              )}
            </div>

            {/* Unified provider + services section */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="flex border-b border-slate-100 px-1">
                <button
                  onClick={() => setActiveTab('services')}
                  className={`text-sm px-5 py-4 font-medium transition-colors border-b-2 ${
                    activeTab === 'services' ? 'text-cyan-600 border-cyan-500 font-semibold' : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  {hasMultipleProviders ? 'ارائه‌دهندگان و خدمات' : 'خدمات'}
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`text-sm px-5 py-4 font-medium transition-colors border-b-2 ${
                    activeTab === 'reviews' ? 'text-cyan-600 border-cyan-500 font-semibold' : 'text-slate-500 border-transparent hover:text-slate-700'
                  }`}
                >
                  نظرات {hasRating ? `(${provider.reviews_count})` : ''}
                </button>
              </div>

              <div className="p-5">
                {/* Services tab */}
                {activeTab === 'services' && (
                  <>
                    {hasMultipleProviders ? (
                      <div className="space-y-4">
                        {siblings.map((sib) => (
                          <ProviderServiceGroup
                            key={sib.id}
                            provider={sib}
                            selectedProviderId={activeProvider?.id}
                            selectedServiceId={selectedService?.id}
                            onSelectService={(svc) => {
                              handleSelectProvider(sib)
                              setSelectedService(svc)
                              setSelectedDate(null)
                              setSelectedSlot(null)
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        {servicesLoading && <Spinner />}
                        {!hasServices && !servicesLoading && (
                          <p className="text-sm text-slate-400 text-center py-8">خدمتی تعریف نشده است.</p>
                        )}
                        {hasServices && (
                          <div className="space-y-2">
                            {services.map((svc) => {
                              const active = selectedService?.id === svc.id
                              return (
                                <ServiceRow key={svc.id} svc={svc} active={active} onSelect={() => { setSelectedService(svc); setSelectedDate(null); setSelectedSlot(null) }} />
                              )
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Reviews tab */}
                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {reviews.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-8">هنوز نظری ثبت نشده.</p>
                    )}
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400 text-sm">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                            <span className="text-xs font-medium text-slate-700">{review.customer_display}</span>
                          </div>
                          <span className="text-xs text-slate-400">{toJalali(review.created_at?.slice(0, 10))}</span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 leading-7">{review.comment}</p>
                        )}
                      </div>
                    ))}
                    {reviewsData?.next && (
                      <button
                        onClick={() => setReviewPage((p) => p + 1)}
                        className="w-full text-sm py-2 rounded-xl border border-slate-200 text-cyan-600 hover:bg-slate-50 transition-colors font-semibold"
                      >
                        نمایش بیشتر
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Booking panel */}
          <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">

              <div className="p-4 border-b border-slate-50">
                <h2 className="text-base font-black text-slate-900">رزرو نوبت</h2>
                <p className="text-xs text-slate-400 mt-0.5">تاریخ و ساعت مناسب را انتخاب کن</p>
              </div>

              <div className="p-4 space-y-4">

                {/* Not available */}
                {!isAvailable && (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs text-amber-700 leading-5">
                      این ارائه‌دهنده هنوز ساعات کاری خود را تنظیم نکرده است. در حال حاضر امکان رزرو وجود ندارد.
                    </p>
                  </div>
                )}

                {/* Service required prompt */}
                {isAvailable && serviceRequired && !canPickDate && (
                  <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3">
                    <p className="text-xs text-cyan-700 leading-5">
                      {hasMultipleProviders ? 'ابتدا یک ارائه‌دهنده و خدمت انتخاب کنید.' : 'ابتدا از تب «خدمات» یک خدمت انتخاب کنید.'}
                    </p>
                  </div>
                )}

                {/* Date picker */}
                {isAvailable && canPickDate && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-2 block">تاریخ</label>
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-3">
                      <DatePicker
                        availableWeekdays={provider.available_weekdays ?? []}
                        selectedDate={selectedDate}
                        onSelect={handleDateSelect}
                      />
                    </div>
                  </div>
                )}

                {/* Slot picker */}
                {isAvailable && selectedDate && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-2 block">ساعت</label>
                    {slotsError ? (
                      <div className="space-y-2">
                        <p className="text-xs text-red-500">خطا در دریافت ساعت‌ها</p>
                        <button onClick={() => refetchSlots()} className="text-xs text-cyan-600 font-semibold">تلاش مجدد</button>
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

                {/* Summary */}
                {(selectedService || selectedDate || selectedSlot) && (
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                    {selectedService && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">خدمت</span>
                        <span className="font-semibold text-slate-700">{selectedService.name}</span>
                      </div>
                    )}
                    {selectedDate && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">تاریخ</span>
                        <span className="font-semibold text-slate-700" dir="ltr">{selectedDate}</span>
                      </div>
                    )}
                    {selectedSlot && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">ساعت</span>
                        <span className="font-semibold text-slate-700 font-mono">{selectedSlot}</span>
                      </div>
                    )}
                    {selectedService && Number(selectedService.price) > 0 && (
                      <div className="border-t border-slate-200 mt-2 pt-2 flex items-center justify-between">
                        <span className="text-xs text-slate-500">مبلغ</span>
                        <span className="text-sm font-black text-cyan-600">
                          {Number(selectedService.price).toLocaleString('fa-IR')} تومان
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* CTA */}
                {isAvailable && selectedSlot && (
                  <button
                    onClick={handleProceed}
                    className="w-full text-white font-black py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-cyan-200"
                    style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
                  >
                    تأیید و پرداخت
                  </button>
                )}
                <p className="text-center text-xs text-slate-400">پرداخت امن با زرین‌پال</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}

