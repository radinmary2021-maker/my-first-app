import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useProviders } from '../../hooks/useDoctors'
import MainLayout from '../../layouts/MainLayout'
import SEOHead from '../../components/SEOHead'
import ImageAvatar from '../../components/ImageAvatar'
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
  { emoji: '💇‍♀️', label: 'آرایش و زیبایی', slug: 'beauty',        bg: 'bg-gradient-to-br from-pink-50 to-pink-100' },
  { emoji: '💪',   label: 'ورزش و فیتنس',  slug: 'fitness',       bg: 'bg-gradient-to-br from-blue-50 to-blue-100' },
  { emoji: '📚',   label: 'آموزش',          slug: 'education',     bg: 'bg-gradient-to-br from-green-50 to-green-100' },
  { emoji: '🧠',   label: 'مشاوره',         slug: 'psychological', bg: 'bg-gradient-to-br from-purple-50 to-purple-100' },
  { emoji: '🐾',   label: 'دامپزشکی',       slug: 'veterinary',    bg: 'bg-gradient-to-br from-amber-50 to-amber-100' },
  { emoji: '🚗',   label: 'خودرو',          slug: 'automotive',    bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100' },
]

const QUICK_SEARCHES = ['آرایشگاه', 'کلینیک زیبایی', 'مشاوره', 'باشگاه ورزشی', 'دامپزشکی']

const TRUST = [
  { value: '+۱,۰۰۰', label: 'کسب‌وکار فعال' },
  { value: '+۵۰,۰۰۰', label: 'نوبت موفق' },
  { value: '۹۸٪', label: 'رضایت مشتریان' },
]

const STEPS = [
  {
    n: 1, title: 'جستجو کن', desc: 'خدمت یا متخصص مورد نظرت را پیدا کن',
    icon: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></>,
    primary: true,
  },
  {
    n: 2, title: 'زمان انتخاب کن', desc: 'تاریخ و ساعت مناسب را انتخاب کن',
    icon: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /><path d="M8 2v4M16 2v4" /><path d="M8 13h2M14 13h2" strokeLinecap="round" /></>,
  },
  {
    n: 3, title: 'تأیید بگیر', desc: 'پیامک تأیید دریافت کن و برو!',
    icon: <path d="M20 6 9 17l-5-5" />,
  },
]

const BIZ_FEATURES = [
  {
    title: 'مدیریت نوبت', desc: 'تقویم هوشمند برای مدیریت تمام نوبت‌ها',
    icon: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M3 9h18" /></>,
  },
  {
    title: 'مدیریت پرسنل', desc: 'هر متخصص برنامه و خدمات جداگانه دارد',
    icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  },
  {
    title: 'گزارش‌های مالی', desc: 'آمار درآمد، رزروها و نرخ بازگشت مشتری',
    icon: <path d="M18 20V10M12 20V4M6 20v-6" />,
  },
  {
    title: 'اطلاع‌رسانی SMS', desc: 'یادآوری خودکار نوبت برای مشتریان',
    icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.63 19a20.49 20.49 0 0 1-4.83-4.72 19.79 19.79 0 0 1-3.06-8.53A2 2 0 0 1 5.11 4h3a2 2 0 0 1 2 1.72A12 12 0 0 0 11 8a2 2 0 0 1-.45 2.11L9.5 11.16a16 16 0 0 0 6.29 6.29l1.05-1.05a2 2 0 0 1 2.11-.45 12 12 0 0 0 2.28.65A2 2 0 0 1 22 18.5v-1.58Z" />,
  },
]

const TESTIMONIALS = [
  { initials: 'س.م', name: 'سارا محمدی', role: 'مشتری', stars: 5, color: 'bg-cyan-100 text-cyan-700',
    text: '«دیگه لازم نیست ساعت‌ها پشت تلفن بمونم. همین‌جا نوبتم رو می‌گیرم.»' },
  { initials: 'ر.ش', name: 'رضا شریفی', role: 'آرایشگر', stars: 5, color: 'bg-purple-100 text-purple-700',
    text: '«از وقتی نوبتیک استفاده می‌کنم، نوبت‌های خالیم ۴۰٪ کمتر شده.»' },
  { initials: 'م.ک', name: 'مریم کریمی', role: 'مربی ورزشی', stars: 4, color: 'bg-green-100 text-green-700',
    text: '«خیلی راحت‌تر از قبل می‌تونم برنامه هفتگیم رو مدیریت کنم.»' },
  { initials: 'ع.ت', name: 'علی تهرانی', role: 'دامپزشک', stars: 5, color: 'bg-amber-100 text-amber-700',
    text: '«پشتیبانی عالی و رابط کاربری ساده. دقیقاً چیزی که لازم داشتم.»' },
]

const PROVIDER_GRADIENTS = [
  'from-cyan-500 to-cyan-400',
  'from-violet-500 to-violet-400',
  'from-emerald-500 to-emerald-400',
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
      <section className="pt-16 pb-20 px-4" style={{ background: 'linear-gradient(135deg, #DDE4FF 0%, #C7D2FE 30%, #CFFAFE 65%, #F8FAFC 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-cyan-100 rounded-full px-4 py-1.5 text-xs font-semibold text-cyan-700 mb-6 shadow-sm">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            بیش از ۱,۰۰۰ کسب‌وکار فعال
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight mb-5">
            با{' '}
            <span style={{ background: 'linear-gradient(135deg,#0891B2,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              نوبتیک
            </span>
            ،
            <br />
            آنلاین نوبت بگیر
          </h1>
          <p className="text-slate-500 text-lg leading-8 max-w-xl mx-auto mb-10">
            از آرایشگاه تا کلینیک، از مشاوره تا آموزش — هر خدمتی که نیاز داری، همین‌جا رزرو کن.
          </p>

          {/* Search box */}
          <form onSubmit={go} className="bg-white rounded-2xl shadow-lg shadow-slate-200 border border-slate-100 p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto mb-8">
            <div className="flex items-center flex-1 gap-3 px-3 py-2">
              <svg className="w-5 h-5 text-cyan-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="آرایشگاه، کلینیک، مشاوره..."
                className="outline-none text-sm text-slate-700 placeholder:text-slate-400 w-full bg-transparent"
              />
            </div>
            <button
              type="submit"
              className="text-white font-bold text-sm px-6 py-3 rounded-xl shrink-0 hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
            >
              جستجو
            </button>
          </form>

          {/* Quick chips */}
          <div className="flex flex-wrap justify-center gap-2 text-sm">
            <span className="text-slate-400 text-xs self-center">جستجوی سریع:</span>
            {QUICK_SEARCHES.map((s) => (
              <button
                key={s}
                onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
                className="bg-white border border-slate-200 hover:border-cyan-300 hover:text-cyan-600 text-slate-600 px-4 py-1.5 rounded-full font-medium transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ══ */}
      <section className="bg-white border-y border-slate-100 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            {TRUST.map((t, i) => (
              <div key={t.label} className={i === 1 ? 'border-x border-slate-100' : ''}>
                <div className="text-2xl font-black text-cyan-500">{t.value}</div>
                <div className="text-xs text-slate-500 mt-1">{t.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES ══ */}
      <section className="py-14 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900">دسته‌بندی‌ها</h2>
              <p className="text-slate-500 text-sm mt-1">خدمت مورد نظرت را پیدا کن</p>
            </div>
            <button
              onClick={() => navigate('/providers')}
              className="text-cyan-600 text-sm font-semibold hover:text-cyan-700 flex items-center gap-1"
            >
              مشاهده همه
              <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {CATEGORIES.map(({ emoji, label, slug, bg }) => (
              <button
                key={slug}
                onClick={() => navigate(`/providers?category=${slug}`)}
                className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col items-center gap-3 text-center cursor-pointer
                           hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${bg}`}>
                  {emoji}
                </div>
                <span className="text-sm font-semibold text-slate-700">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED PROVIDERS ══ */}
      {featured.length > 0 && (
        <section className="py-14 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">محبوب‌ترین‌ها</h2>
                <p className="text-slate-500 text-sm mt-1">بیشترین رزرو این هفته</p>
              </div>
              <button
                onClick={() => navigate('/providers')}
                className="text-cyan-600 text-sm font-semibold hover:text-cyan-700 flex items-center gap-1"
              >
                مشاهده همه
                <svg className="w-4 h-4 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" strokeLinecap="round" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/providers/${p.id}`)}
                  className="bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer
                             hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200"
                >
                  <div className="h-44 relative">
                    <ImageAvatar src={p.logo} alt={p.business_name || p.full_name} fallbackText={p.business_name || p.full_name} size="w-full h-full" shape="rounded-none" />
                    {p.average_rating != null && p.reviews_count > 0 && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-xs font-bold text-amber-600 px-2 py-1 rounded-full flex items-center gap-1">
                        ★ {p.average_rating}
                      </div>
                    )}
                    {(p.available_weekdays ?? []).length > 0 && (
                      <div className="absolute top-3 left-3 bg-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        فعال
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-base mb-0.5">
                      {p.business_name || p.full_name}
                    </h3>
                    <p className="text-slate-400 text-xs mb-3">
                      {p.category_display || p.specialty}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                        {p.slot_duration ?? p.visit_duration} دقیقه
                      </span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-cyan-600 font-semibold">{formatFee(p.service_fee ?? p.consultation_fee)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/providers/${p.id}`) }}
                      className="w-full bg-cyan-50 hover:bg-cyan-500 hover:text-white text-cyan-600 font-bold text-sm py-2.5 rounded-xl
                                 transition-colors border border-cyan-100 hover:border-cyan-500"
                    >
                      رزرو نوبت
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ HOW IT WORKS ══ */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-black text-slate-900 mb-2">چطور کار می‌کند؟</h2>
          <p className="text-slate-500 text-sm mb-12">در سه قدم ساده نوبت بگیر</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-8 right-[16.66%] left-[16.66%] h-0.5 bg-slate-100 z-0" />
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col items-center gap-4 relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                  s.primary
                    ? 'shadow-lg shadow-cyan-200'
                    : 'bg-white border-2 border-cyan-100 shadow-md'
                }`} style={s.primary ? { background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' } : undefined}>
                  <svg className={`w-7 h-7 ${s.primary ? 'text-white' : 'text-cyan-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {s.icon}
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-bold text-cyan-500 mb-1">مرحله {s.n}</div>
                  <h3 className="font-bold text-slate-800 mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-6">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOR BUSINESSES ══ */}
      <section className="py-14 px-4 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs font-semibold text-cyan-400 mb-6">
                برای صاحبان کسب‌وکار
              </div>
              <h2 className="text-3xl font-black text-white leading-tight mb-5">
                کسب‌وکارت را
                <br />
                <span className="text-cyan-400">آنلاین کن</span>
              </h2>
              <p className="text-slate-400 leading-8 mb-8">
                مدیریت نوبت‌ها، مشتریان و گزارش‌های مالی — همه در یک پنل ساده.
                بدون پیچیدگی، بدون نیاز به دانش فنی.
              </p>
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                className="text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-cyan-900"
                style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
              >
                همین الان شروع کن — رایگان
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {BIZ_FEATURES.map((f) => (
                <div key={f.title} className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
                  <div className="w-10 h-10 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {f.icon}
                    </svg>
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{f.title}</h4>
                  <p className="text-slate-500 text-xs leading-5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ══ */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-2">نظر کاربران</h2>
            <p className="text-slate-500 text-sm">چه کسانی از نوبتیک استفاده می‌کنند</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                <div className="flex items-center gap-1 text-amber-400 text-sm mb-3">
                  {'★'.repeat(t.stars)}{'☆'.repeat(5 - t.stars)}
                </div>
                <p className="text-slate-600 text-sm leading-7 mb-4">{t.text}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700">{t.name}</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 40%, #818CF8 80%, #FFFFFF 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-4">آماده‌ای شروع کنی؟</h2>
          <p className="text-cyan-100 mb-8 text-lg">همین الان رایگان ثبت‌نام کن — بدون نیاز به کارت بانکی</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/providers')}
              className="bg-white text-cyan-600 font-bold px-8 py-3.5 rounded-xl hover:bg-cyan-50 transition-colors shadow-lg"
            >
              ثبت نوبت رایگان
            </button>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              className="bg-white/10 border border-white/30 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-white/20 transition-colors"
            >
              ثبت کسب‌وکار
            </button>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
