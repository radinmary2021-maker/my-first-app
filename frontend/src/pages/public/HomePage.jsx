import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useProviders } from '../../hooks/useDoctors'
import MainLayout from '../../layouts/MainLayout'
import SEOHead from '../../components/SEOHead'
import ImageAvatar from '../../components/ImageAvatar'
import { BeautyIcon, FitnessIcon, EducationIcon, CounselingIcon, VeterinaryIcon, AutomotiveIcon } from '../../components/CategoryIcons'
import { formatFee } from '../../utils/date'

const HOME_JSON_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'نوبتیک',
    url: 'https://nobatiic.ir',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: 'https://nobatiic.ir/search?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'نوبتیک',
    url: 'https://nobatiic.ir',
    description: 'پلتفرم رزرو آنلاین نوبت برای هر کسب‌وکاری',
  },
]

const CATEGORIES = [
  { label: 'آرایش', slug: 'beauty', emoji: '💇‍♀️', Icon: BeautyIcon },
  { label: 'ورزش', slug: 'fitness', emoji: '💪', Icon: FitnessIcon },
  { label: 'مشاوره', slug: 'psychological', emoji: '🧠', Icon: CounselingIcon },
  { label: 'دامپزشکی', slug: 'veterinary', emoji: '🐾', Icon: VeterinaryIcon },
  { label: 'خودرو', slug: 'automotive', emoji: '🚗', Icon: AutomotiveIcon },
  { label: 'آموزش', slug: 'education', emoji: '📚', Icon: EducationIcon },
]

const QUICK_SEARCHES = ['آرایشگاه', 'باشگاه', 'روانشناس', 'دامپزشک']

const TRUST = [
  { value: '+۱,۰۰۰', label: 'کسب‌وکار فعال', gradient: 'linear-gradient(135deg,#00D4C8,#00A8FF)' },
  { value: '+۵۰K', label: 'نوبت موفق', gradient: 'linear-gradient(135deg,#39FF14,#00D4C8)' },
  { value: '۹۸٪', label: 'رضایت مشتری', gradient: 'linear-gradient(135deg,#00D4C8,#39FF14)' },
  { value: '۲۴/۷', label: 'همیشه آنلاین', gradient: 'linear-gradient(135deg,#FF6B2B,#FF4500)' },
]

const BIZ_FEATURES = [
  {
    title: 'مدیریت نوبت', desc: 'تقویم هوشمند برای تمام نوبت‌ها',
    icon: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /></>,
    iconBg: 'rgba(0,212,200,0.1)', iconBorder: 'rgba(0,212,200,0.15)', iconColor: '#00D4C8',
  },
  {
    title: 'گزارش مالی', desc: 'آمار درآمد و رشد کسب‌وکار',
    icon: <path d="M18 20V10M12 20V4M6 20v-6" />,
    iconBg: 'rgba(57,255,20,0.08)', iconBorder: 'rgba(57,255,20,0.15)', iconColor: '#39FF14',
  },
  {
    title: 'مدیریت تیم', desc: 'هر متخصص برنامه جداگانه',
    icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
    iconBg: 'rgba(0,212,200,0.1)', iconBorder: 'rgba(0,212,200,0.15)', iconColor: '#00D4C8',
  },
  {
    title: 'SMS هوشمند', desc: 'یادآوری خودکار به مشتریان',
    icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07" />,
    iconBg: 'rgba(255,107,43,0.1)', iconBorder: 'rgba(255,107,43,0.2)', iconColor: '#FF6B2B',
  },
]

const TESTIMONIALS = [
  { initials: 'س.م', name: 'سارا محمدی', role: 'مشتری', stars: 5,
    text: '«دیگه لازم نیست ساعت‌ها پشت تلفن بمونم. همین‌جا نوبتم رو می‌گیرم.»' },
  { initials: 'ر.ش', name: 'رضا شریفی', role: 'آرایشگر', stars: 5,
    text: '«از وقتی نوبتیک استفاده می‌کنم، نوبت‌های خالیم ۴۰٪ کمتر شده.»' },
  { initials: 'م.ک', name: 'مریم کریمی', role: 'مربی ورزشی', stars: 4,
    text: '«خیلی راحت‌تر از قبل می‌تونم برنامه هفتگیم رو مدیریت کنم.»' },
  { initials: 'ع.ت', name: 'علی تهرانی', role: 'دامپزشک', stars: 5,
    text: '«پشتیبانی عالی و رابط کاربری ساده. دقیقاً چیزی که لازم داشتم.»' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)
  const [search, setSearch] = useState('')
  const { data: providers }  = useProviders()
  const featured = (() => {
    if (!providers) return []
    const seen = new Set()
    return providers.filter((p) => {
      const key = p.business_id || p.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 3)
  })()

  function go(e) {
    e.preventDefault()
    navigate(search.trim() ? `/search?q=${encodeURIComponent(search.trim())}` : '/providers')
  }

  return (
    <MainLayout fullWidth>
      <SEOHead
        description="نوبتیک — پلتفرم رزرو آنلاین نوبت برای آرایشگاه، باشگاه، مشاوره، آموزشگاه و هر کسب‌وکاری. سریع، ساده، بدون انتظار تلفنی."
        canonical="/"
        jsonLd={HOME_JSON_LD}
      />

      {/* ══ HERO ══ */}
      <section className="grid-bg relative overflow-hidden" style={{ minHeight: '92vh', display: 'flex', alignItems: 'center', padding: '80px 28px 60px' }}>

        {/* Scanline */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#00D4C8,transparent)', animation: 'scan 6s ease-in-out infinite', pointerEvents: 'none', top: '30%' }} />

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '-80px', right: '-60px', width: '560px', height: '560px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,212,200,0.07),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '10%', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(57,255,20,0.04),transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '40%', right: '8%', width: '240px', height: '240px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,107,43,0.06),transparent 65%)', pointerEvents: 'none' }} />

        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: '36px', right: '36px', width: '28px', height: '28px', borderTop: '2px solid rgba(0,212,200,0.25)', borderRight: '2px solid rgba(0,212,200,0.25)' }} />
        <div style={{ position: 'absolute', top: '36px', left: '36px', width: '28px', height: '28px', borderTop: '2px solid rgba(0,212,200,0.25)', borderLeft: '2px solid rgba(0,212,200,0.25)' }} />
        <div style={{ position: 'absolute', bottom: '36px', right: '36px', width: '28px', height: '28px', borderBottom: '2px solid rgba(0,212,200,0.25)', borderRight: '2px solid rgba(0,212,200,0.25)' }} />
        <div style={{ position: 'absolute', bottom: '36px', left: '36px', width: '28px', height: '28px', borderBottom: '2px solid rgba(0,212,200,0.25)', borderLeft: '2px solid rgba(0,212,200,0.25)' }} />

        <div className="max-w-[1200px] mx-auto w-full relative z-10">
          <div className="max-w-[820px]">

            {/* Pill */}
            <div className="inline-flex items-center gap-[7px] px-[14px] py-[5px] rounded-full text-xs font-bold mb-[30px]"
                 style={{ border: '1px solid rgba(0,212,200,0.22)', background: 'rgba(0,212,200,0.07)', color: '#00D4C8', letterSpacing: '0.07em' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#39FF14', boxShadow: '0 0 8px #39FF14', animation: 'blink 2s ease-in-out infinite' }} />
              سیستم رزرو هوشمند — آنلاین ۲۴ ساعته
            </div>

            {/* Hero title */}
            <h1 style={{ fontSize: 'clamp(3rem,8vw,6.2rem)', fontWeight: 900, lineHeight: 1.0, margin: '0 0 26px', letterSpacing: '-0.03em', color: '#E8F4FF' }}>
              نوبتت رو<br />
              <span className="cyan-text">هوشمند</span><br />
              بگیر
            </h1>

            {/* Neon accent line */}
            <div style={{ width: '80px', height: '3px', background: 'linear-gradient(90deg,#39FF14,transparent)', borderRadius: '2px', marginBottom: '26px', boxShadow: '0 0 12px rgba(57,255,20,0.4)' }} />

            <p style={{ fontSize: '1.1rem', color: '#6B8FAD', lineHeight: 1.85, margin: '0 0 44px', maxWidth: '500px' }}>
              از آرایشگاه تا کلینیک، از باشگاه تا دامپزشکی —<br />بدون تلفن، بدون انتظار.
            </p>

            {/* Search box */}
            <form onSubmit={go}
                  className="flex items-center rounded-2xl mb-[22px] transition-all max-w-[640px]"
                  style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.18)', padding: '6px' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,200,0.45)'}
                  onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,200,0.18)'}>
              <div className="flex items-center flex-1 gap-2.5 px-3.5 py-2.5">
                <svg style={{ width: '16px', height: '16px', color: '#00D4C8', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="خدمت یا کسب‌وکار..."
                  className="outline-none text-sm w-full"
                  style={{ background: 'transparent', color: '#E8F4FF', fontFamily: 'inherit', border: 'none' }}
                />
              </div>
              <div style={{ width: '1px', height: '32px', background: 'rgba(0,212,200,0.12)' }} />
              <div className="flex items-center gap-2 px-3.5 py-2.5">
                <svg style={{ width: '14px', height: '14px', color: '#00D4C8', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" /><circle cx="12" cy="9" r="2.5" /></svg>
                <input
                  placeholder="شهر..."
                  className="outline-none text-sm"
                  style={{ background: 'transparent', color: '#E8F4FF', fontFamily: 'inherit', border: 'none', width: '70px' }}
                />
              </div>
              <button
                type="submit"
                className="text-white font-extrabold text-sm px-6 py-[11px] rounded-[10px] cursor-pointer transition-all shrink-0"
                style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
              >
                جستجو
              </button>
            </form>

            {/* Quick chips */}
            <div className="flex flex-wrap gap-2 items-center">
              <span style={{ fontSize: '11px', color: '#6B8FAD', fontWeight: 700, letterSpacing: '0.05em' }}>پرجستجو:</span>
              {QUICK_SEARCHES.map((s) => (
                <button
                  key={s}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
                  className="cursor-pointer transition-all text-xs font-bold px-3.5 py-1.5 rounded-full"
                  style={{ background: 'rgba(0,212,200,0.06)', border: '1px solid rgba(0,212,200,0.18)', color: '#00D4C8', fontFamily: 'inherit' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,212,200,0.14)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,212,200,0.06)'}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ STATS ══ */}
      <section style={{ borderTop: '1px solid rgba(0,212,200,0.08)', borderBottom: '1px solid rgba(0,212,200,0.08)', padding: '26px 28px', background: '#1C2A3E' }}>
        <div className="max-w-[1000px] mx-auto grid grid-cols-4 text-center">
          {TRUST.map((t, i) => (
            <div key={t.label} style={{ padding: '14px', borderLeft: i < 3 ? '1px solid rgba(0,212,200,0.08)' : 'none' }}>
              <div style={{ fontSize: '2.1rem', fontWeight: 900, background: t.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t.value}</div>
              <div style={{ fontSize: '11px', color: '#6B8FAD', marginTop: '4px' }}>{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CATEGORIES ══ */}
      <section className="grid-bg" style={{ padding: '80px 28px' }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-end justify-between mb-[42px]">
            <div>
              <div className="inline-flex items-center gap-[7px] px-[14px] py-[5px] rounded-full text-xs font-bold mb-3.5"
                   style={{ border: '1px solid rgba(0,212,200,0.22)', background: 'rgba(0,212,200,0.07)', color: '#00D4C8' }}>
                دسته‌بندی‌ها
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.2 }}>
                دنبال چی<br /><span className="neon-text">می‌گردی؟</span>
              </h2>
            </div>
            <button onClick={() => navigate('/providers')} className="transition-colors text-sm font-bold" style={{ color: '#00D4C8', textDecoration: 'none' }}>
              مشاهده همه ←
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {CATEGORIES.map(({ label, slug, emoji }, i) => (
              <button
                key={slug}
                onClick={() => navigate(`/providers?category=${slug}`)}
                className="flex flex-col items-center gap-2.5 p-[18px] rounded-[18px] text-center cursor-pointer transition-all"
                style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.07)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.35)'; e.currentTarget.style.background = 'rgba(0,212,200,0.06)'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,212,200,0.12)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.07)'; e.currentTarget.style.background = '#1C2A3E'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div className="w-[50px] h-[50px] rounded-[14px] flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg,rgba(0,212,200,0.12),rgba(0,168,255,0.06))', border: '1px solid rgba(0,212,200,0.1)', animation: 'icon-float 2.5s ease-in-out infinite', animationDelay: `${i * 0.2}s` }}>
                  <img
                    src={`/icons/${slug}.png`}
                    alt={label}
                    style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span style="font-size:23px">${emoji}</span>` }}
                  />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#E8F4FF' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED PROVIDERS ══ */}
      {featured.length > 0 && (
        <section style={{ padding: '0 28px 80px' }}>
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-[42px]">
              <div className="inline-flex items-center gap-[7px] px-[14px] py-[5px] rounded-full text-xs font-bold mb-3.5"
                   style={{ border: '1px solid rgba(0,212,200,0.22)', background: 'rgba(0,212,200,0.07)', color: '#00D4C8' }}>
                محبوب‌ترین‌ها
              </div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.2 }}>
                این هفته<br /><span className="cyan-text">پرطرفدار</span>
              </h2>
            </div>

            <div className="featured-scroll" style={{ display: 'flex', gap: '16px', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', paddingBottom: '12px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {featured.map((p) => {
                const isActive = (p.available_weekdays ?? []).length > 0
                const hasRating = p.average_rating != null && p.reviews_count > 0
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/providers/${p.id}`)}
                    className="overflow-hidden rounded-[20px] cursor-pointer transition-all"
                    style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.07)', flexShrink: 0, width: 'clamp(280px, 80vw, 340px)', scrollSnapAlign: 'start' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.28)'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,212,200,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div className="h-[162px] relative" style={{ background: 'linear-gradient(135deg,#061820,#0a2a30)' }}>
                      <ImageAvatar src={p.logo} alt={p.business_name || p.full_name} fallbackText={p.business_name || p.full_name} size="w-full h-full" shape="rounded-none" blurBg />
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#00D4C8,transparent)' }} />
                      {isActive && (
                        <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ background: 'rgba(57,255,20,0.15)', border: '1px solid rgba(57,255,20,0.3)', color: '#39FF14', animation: 'neon-pulse 2s ease-in-out infinite' }}>
                          ● باز است
                        </span>
                      )}
                      {hasRating && (
                        <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
                              style={{ background: 'rgba(255,107,43,0.85)', color: 'white' }}>
                          ★ {p.average_rating}
                        </span>
                      )}
                    </div>
                    <div className="p-[18px]">
                      <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px', color: '#E8F4FF' }}>
                        {p.business_name || p.full_name}
                      </h3>
                      <p style={{ fontSize: '11px', color: '#6B8FAD', margin: '0 0 16px' }}>
                        {p.category_display || p.specialty}
                      </p>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '13px', color: '#00D4C8', fontWeight: 800 }}>
                          {formatFee(p.service_fee ?? p.consultation_fee)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/providers/${p.id}`) }}
                          className="text-white font-extrabold text-xs px-[18px] py-2 rounded-[10px] cursor-pointer transition-all"
                          style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
                        >
                          رزرو ←
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ FOR BUSINESSES ══ */}
      <section style={{ padding: '80px 28px', background: '#1C2A3E', borderTop: '1px solid rgba(0,212,200,0.07)' }}>
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <div className="inline-flex items-center gap-[7px] px-[14px] py-[5px] rounded-full text-xs font-bold mb-5"
                 style={{ border: '1px solid rgba(0,212,200,0.22)', background: 'rgba(0,212,200,0.07)', color: '#00D4C8' }}>
              برای کسب‌وکارها
            </div>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 900, margin: '0 0 20px', lineHeight: 1.15 }}>
              کسب‌وکارت رو<br /><span className="cyan-text">آنلاین کن</span>
            </h2>
            <div style={{ width: '60px', height: '3px', background: 'linear-gradient(90deg,#39FF14,transparent)', borderRadius: '2px', marginBottom: '22px', boxShadow: '0 0 10px rgba(57,255,20,0.3)' }} />
            <p style={{ color: '#6B8FAD', lineHeight: 1.9, margin: '0 0 36px', fontSize: '0.95rem' }}>
              مدیریت نوبت‌ها، مشتریان و درآمد — همه در یک پنل ساده. بدون دانش فنی.
            </p>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="text-white font-extrabold text-[15px] px-8 py-[15px] rounded-xl cursor-pointer transition-all"
              style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
            >
              شروع رایگان ←
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {BIZ_FEATURES.map((f) => (
              <div key={f.title} className="rounded-[20px] p-[22px] transition-all"
                   style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.07)' }}
                   onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.28)'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,212,200,0.1)' }}
                   onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}>
                <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center mb-3.5"
                     style={{ background: f.iconBg, border: `1px solid ${f.iconBorder}` }}>
                  <svg style={{ width: '18px', height: '18px', color: f.iconColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{f.icon}</svg>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '6px', color: '#E8F4FF' }}>{f.title}</div>
                <div style={{ fontSize: '11px', color: '#6B8FAD', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="grid-bg" style={{ padding: '80px 28px' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '8px' }}>نظر <span className="cyan-text">کاربران</span></h2>
            <p style={{ color: '#6B8FAD', fontSize: '0.9rem' }}>چه کسانی از نوبتیک استفاده می‌کنند</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-[20px] p-5 transition-all"
                   style={{ background: '#1C2A3E', border: '1px solid rgba(0,212,200,0.07)' }}
                   onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.28)'; e.currentTarget.style.transform = 'translateY(-5px)' }}
                   onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                <div className="flex items-center gap-1 text-sm mb-3" style={{ color: '#FF6B2B' }}>
                  {'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}
                </div>
                <p style={{ color: '#E8F4FF', fontSize: '0.875rem', lineHeight: 1.8, marginBottom: '16px' }}>{t.text}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                       style={{ background: 'rgba(0,212,200,0.1)', color: '#00D4C8' }}>
                    {t.initials}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#E8F4FF' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: '#6B8FAD' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="grid-bg relative overflow-hidden" style={{ padding: '100px 28px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '280px', background: 'radial-gradient(ellipse,rgba(0,212,200,0.08),transparent 70%)', pointerEvents: 'none' }} />
        <div className="relative z-10 max-w-[600px] mx-auto">
          <div className="inline-flex items-center gap-[7px] px-[14px] py-[5px] rounded-full text-xs font-bold mb-5"
               style={{ border: '1px solid rgba(0,212,200,0.22)', background: 'rgba(0,212,200,0.07)', color: '#00D4C8' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#39FF14', boxShadow: '0 0 8px #39FF14', animation: 'blink 2s ease-in-out infinite' }} />
            همین الان شروع کن
          </div>
          <h2 style={{ fontSize: '2.8rem', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.15 }}>
            آماده‌ای؟<br /><span className="cyan-text">نوبتت رو بگیر</span>
          </h2>
          <p style={{ color: '#6B8FAD', margin: '0 0 40px', fontSize: '1.05rem' }}>رایگان — بدون نیاز به کارت بانکی</p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <button
              onClick={() => navigate('/providers')}
              className="text-white font-extrabold text-[15px] px-9 py-[15px] rounded-xl cursor-pointer transition-all"
              style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
            >
              ثبت نوبت رایگان
            </button>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="font-bold text-[15px] px-9 py-[15px] rounded-xl cursor-pointer transition-all"
              style={{ color: '#00D4C8', border: '1px solid rgba(0,212,200,0.3)', background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,200,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,212,200,0.6)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(0,212,200,0.3)' }}
            >
              ثبت کسب‌وکار
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
