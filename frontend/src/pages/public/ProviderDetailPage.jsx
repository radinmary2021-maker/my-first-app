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
      className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors group"
      style={active
        ? { background: 'rgba(0,212,200,0.06)', border: '1px solid rgba(0,212,200,0.2)' }
        : { border: '1px solid transparent' }
      }
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
             style={{ background: active ? 'rgba(0,212,200,0.1)' : 'rgba(0,212,200,0.04)' }}>
          ✂️
        </div>
        <div>
          <div className="text-sm font-semibold" style={{ color: active ? '#00D4C8' : '#DCF0F5' }}>{svc.name}</div>
          <div className="text-xs mt-0.5" style={{ color: '#4A6E8A' }}>{svc.duration_minutes} دقیقه</div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {Number(svc.price) > 0 && (
          <span className="text-sm font-bold" style={{ color: '#DCF0F5' }}>{Number(svc.price).toLocaleString('fa-IR')}ت</span>
        )}
        <button className="text-xs font-extrabold px-3 py-1.5 rounded-lg transition-all text-white"
                style={active
                  ? { background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', opacity: 1 }
                  : { background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', opacity: 0 }
                }>
          {active ? '✓ انتخاب شد' : 'انتخاب'}
        </button>
      </div>
    </div>
  )
}

function ProviderServiceGroup({ provider: sib, selectedProviderId, selectedServiceId, onSelectService }) {
  const isThisProvider = selectedProviderId === sib.id
  const { data: svcList, isLoading } = useProviderServices(sib.id)

  return (
    <div className="rounded-2xl p-4 transition-all"
         style={isThisProvider
           ? { border: '1px solid rgba(0,212,200,0.2)', background: 'rgba(0,212,200,0.04)' }
           : { border: '1px solid rgba(0,212,200,0.07)' }
         }>
      <div className="flex items-center gap-3 mb-3">
        <ImageAvatar src={sib.avatar} alt={sib.full_name} fallbackText={sib.full_name} size="w-12 h-12" shape="rounded-xl" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold" style={{ color: isThisProvider ? '#00D4C8' : '#DCF0F5' }}>{sib.full_name}</div>
          {sib.specialty && <div className="text-xs" style={{ color: '#4A6E8A' }}>{sib.specialty}</div>}
        </div>
      </div>

      {isLoading && <Spinner />}
      {svcList && svcList.length > 0 && (
        <div className="space-y-1.5">
          {svcList.map((svc) => {
            const active = isThisProvider && selectedServiceId === svc.id
            return (
              <ServiceRow key={svc.id} svc={svc} active={active} onSelect={() => onSelectService(sib, svc)} />
            )
          })}
        </div>
      )}
      {svcList && svcList.length === 0 && !isLoading && (
        <p className="text-xs text-slate-400 text-center py-2">خدمتی تعریف نشده.</p>
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
      <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs" style={{ color: '#4A6E8A' }}>
          <button onClick={() => navigate('/')} className="transition-colors" style={{ color: '#4A6E8A' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00D4C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#4A6E8A'}>خانه</button>
          <svg className="w-3 h-3 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          <button onClick={() => navigate('/providers')} className="transition-colors" style={{ color: '#4A6E8A' }} onMouseEnter={(e) => e.currentTarget.style.color = '#00D4C8'} onMouseLeave={(e) => e.currentTarget.style.color = '#4A6E8A'}>{category || 'کسب‌وکارها'}</button>
          <svg className="w-3 h-3 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          <span className="font-medium" style={{ color: '#DCF0F5' }}>{providerName}</span>
        </div>
      </div>

      {/* Cover */}
      <div>
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
            <div className="rounded-[20px] p-5" style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <ImageAvatar src={provider.logo} alt={providerName} fallbackText={providerName} size="w-16 h-16" shape="rounded-2xl" />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-xl font-black cyan-text">{providerName}</h1>
                      {isAvailable
                        ? <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(57,255,20,0.15)', border: '1px solid rgba(57,255,20,0.3)', color: '#39FF14' }}>● باز</span>
                        : <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,212,200,0.05)', color: '#4A6E8A' }}>غیرفعال</span>
                      }
                    </div>
                    <p className="text-sm" style={{ color: '#4A6E8A' }}>{category}</p>
                    {staffName && (
                      <p className="text-sm mt-1" style={{ color: '#4A6E8A' }}>با مدیریت: <span className="font-semibold" style={{ color: '#DCF0F5' }}>{staffName}</span></p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {hasRating && (
                        <div className="flex items-center gap-1">
                          <span style={{ color: '#FF6B2B' }}>{'★'.repeat(Math.floor(provider.average_rating))}{'☆'.repeat(5 - Math.floor(provider.average_rating))}</span>
                          <span className="text-sm font-bold" style={{ color: '#DCF0F5' }}>{provider.average_rating}</span>
                          <span className="text-xs" style={{ color: '#4A6E8A' }}>({provider.reviews_count} نظر)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleShare}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                    style={{ border: '1px solid rgba(0,212,200,0.2)', color: '#4A6E8A' }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>
                  </button>
                </div>
              </div>

              {/* Quick info pills */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,212,200,0.07)' }}>
                {provider.slot_duration && (
                  <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,212,200,0.07)', border: '1px solid rgba(0,212,200,0.22)', color: '#00D4C8' }}>
                    <svg className="w-3.5 h-3.5" style={{ color: '#00D4C8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    مدت نوبت: {provider.slot_duration} دقیقه
                  </div>
                )}
                {provider.service_fee && (
                  <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,212,200,0.07)', border: '1px solid rgba(0,212,200,0.22)', color: '#00D4C8' }}>
                    💰 {formatFee(provider.service_fee)}
                  </div>
                )}
              </div>

              {provider.bio && (
                <p className="text-sm leading-7 mt-3" style={{ color: '#4A6E8A' }}>{provider.bio}</p>
              )}
            </div>

            {/* Unified provider + services section */}
            <div className="rounded-[20px] overflow-hidden" style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}>
              <div className="flex px-1" style={{ borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
                <button
                  onClick={() => setActiveTab('services')}
                  className="text-sm px-5 py-4 font-medium transition-colors border-b-2"
                  style={activeTab === 'services'
                    ? { color: '#00D4C8', borderColor: '#00D4C8', fontWeight: 600 }
                    : { color: '#4A6E8A', borderColor: 'transparent' }
                  }
                >
                  {hasMultipleProviders ? 'ارائه‌دهندگان و خدمات' : 'خدمات'}
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="text-sm px-5 py-4 font-medium transition-colors border-b-2"
                  style={activeTab === 'reviews'
                    ? { color: '#00D4C8', borderColor: '#00D4C8', fontWeight: 600 }
                    : { color: '#4A6E8A', borderColor: 'transparent' }
                  }
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
                            onSelectService={(provider, svc) => {
                              handleSelectProvider(provider)
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
                          <p className="text-sm text-center py-8" style={{ color: '#4A6E8A' }}>خدمتی تعریف نشده است.</p>
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
            <div className="rounded-[20px] overflow-hidden" style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}>

              <div className="p-4" style={{ borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
                <h2 className="text-base font-black" style={{ color: '#DCF0F5' }}>رزرو نوبت</h2>
                <p className="text-xs mt-0.5" style={{ color: '#4A6E8A' }}>تاریخ و ساعت مناسب را انتخاب کن</p>
              </div>

              <div className="p-4 space-y-4">

                {/* Not available */}
                {!isAvailable && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    <p className="text-xs leading-5" style={{ color: '#F59E0B' }}>
                      این ارائه‌دهنده هنوز ساعات کاری خود را تنظیم نکرده است. در حال حاضر امکان رزرو وجود ندارد.
                    </p>
                  </div>
                )}

                {/* Service required prompt */}
                {isAvailable && serviceRequired && !canPickDate && (
                  <div className="rounded-xl p-3" style={{ background: 'rgba(0,212,200,0.06)', border: '1px solid rgba(0,212,200,0.15)' }}>
                    <p className="text-xs leading-5" style={{ color: '#00D4C8' }}>
                      {hasMultipleProviders ? 'ابتدا یک ارائه‌دهنده و خدمت انتخاب کنید.' : 'ابتدا از تب «خدمات» یک خدمت انتخاب کنید.'}
                    </p>
                  </div>
                )}

                {/* Date picker */}
                {isAvailable && canPickDate && (
                  <div>
                    <label className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>تاریخ</label>
                    <div className="rounded-xl p-3" style={{ background: '#111E2E', border: '1px solid rgba(0,212,200,0.1)' }}>
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
                    <label className="text-xs font-bold mb-2 block" style={{ color: '#4A6E8A' }}>ساعت</label>
                    {slotsError ? (
                      <div className="space-y-2">
                        <p className="text-xs" style={{ color: '#EF4444' }}>خطا در دریافت ساعت‌ها</p>
                        <button onClick={() => refetchSlots()} className="text-xs font-semibold" style={{ color: '#00D4C8' }}>تلاش مجدد</button>
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
                  <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(0,212,200,0.03)', border: '1px solid rgba(0,212,200,0.07)' }}>
                    {selectedService && (
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: '#4A6E8A' }}>خدمت</span>
                        <span className="font-semibold" style={{ color: '#DCF0F5' }}>{selectedService.name}</span>
                      </div>
                    )}
                    {selectedDate && (
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: '#4A6E8A' }}>تاریخ</span>
                        <span className="font-semibold" style={{ color: '#DCF0F5' }}>{toJalali(selectedDate)}</span>
                      </div>
                    )}
                    {selectedSlot && (
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: '#4A6E8A' }}>ساعت</span>
                        <span className="font-semibold font-mono" style={{ color: '#DCF0F5' }}>{selectedSlot}</span>
                      </div>
                    )}
                    {selectedService && Number(selectedService.price) > 0 && (
                      <div className="mt-2 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid rgba(0,212,200,0.1)' }}>
                        <span className="text-xs" style={{ color: '#4A6E8A' }}>مبلغ</span>
                        <span className="text-sm font-black" style={{ color: '#00D4C8' }}>
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
                    className="w-full text-white font-black py-3.5 rounded-xl text-sm transition-all"
                    style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
                  >
                    تأیید و پرداخت
                  </button>
                )}
                <p className="text-center text-xs" style={{ color: '#4A6E8A' }}>پرداخت امن با زرین‌پال</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </MainLayout>
  )
}

