import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import SEOHead from '../../components/SEOHead'

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M3 9h18M8 2v4M16 2v4" strokeLinecap="round" />
      </svg>
    ),
    title: 'رزرو آنلاین ۲۴/۷',
    desc: 'مشتریان در هر ساعتی از شبانه‌روز بدون تماس تلفنی نوبت می‌گیرند.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'تأیید فوری نوبت',
    desc: 'پیامک تأیید بلافاصله پس از رزرو ارسال می‌شود — بدون انتظار.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" strokeLinecap="round" />
      </svg>
    ),
    title: 'پرداخت آنلاین امن',
    desc: 'دریافت پیش‌پرداخت از مشتریان پیش از مراجعه — کاهش غیبت‌ها.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'راه‌اندازی سریع',
    desc: 'در کمتر از ۱۰ دقیقه کسب‌وکار خود را آنلاین کنید.',
  },
]

const CATEGORIES = [
  'آرایش و زیبایی', 'ورزش و تناسب اندام', 'آموزش و تدریس',
  'مشاوره تخصصی', 'عکاسی و فیلم', 'حیوانات خانگی',
  'آشپزی و شیرینی', 'خدمات تخصصی',
]

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <MainLayout>
      <SEOHead
        title="درباره نوبتیک"
        description="نوبتیک پلتفرم رزرو آنلاین نوبت برای هر کسب‌وکاری است — از آرایشگاه و باشگاه تا مشاوره و آموزشگاه. با ما کسب‌وکار خود را آنلاین کنید."
        canonical="/about"
      />

      <div className="max-w-3xl mx-auto space-y-16" dir="rtl">

        {/* ── Hero ── */}
        <section className="text-center space-y-4 pt-4">
          <span className="inline-block bg-cyan-50 text-cyan-700 text-xs font-bold px-4 py-1.5 rounded-full border border-cyan-100">
            درباره ما
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-snug">
            نوبتیک — رزرو آنلاین نوبت
            <br />
            <span className="text-cyan-600">برای هر کسب‌وکاری</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-xl mx-auto">
            نوبتیک یک پلتفرم ایرانی است که به کسب‌وکارها کمک می‌کند سیستم نوبت‌دهی آنلاین
            حرفه‌ای داشته باشند — و به مشتریان اجازه می‌دهد بدون تماس تلفنی، در هر زمانی نوبت بگیرند.
          </p>
        </section>

        {/* ── Mission ── */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
          <h2 className="text-xl font-bold text-gray-900">مأموریت ما</h2>
          <p className="text-gray-600 leading-relaxed">
            ما باور داریم که هر کسب‌وکاری — چه یک آرایشگاه کوچک، چه یک باشگاه ورزشی یا یک مشاور تخصصی —
            می‌تواند از مزایای نوبت‌دهی دیجیتال بهره‌مند شود. هدف ما ساده است:
            <strong className="text-gray-800"> کاهش زمان تلف‌شده برای هر دو طرف</strong>؛
            مشتری وقتش را با انتظار پشت تلفن از دست ندهد و کسب‌وکار بتواند ظرفیتش را بهتر مدیریت کند.
          </p>
          <p className="text-gray-600 leading-relaxed">
            نوبتیک با تمرکز بر سادگی و تجربه کاربری فارسی ساخته شده — بدون پیچیدگی‌های غیرضروری،
            بدون نیاز به دانش فنی برای راه‌اندازی.
          </p>
        </section>

        {/* ── Features ── */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900">چرا نوبتیک؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">{f.title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">حوزه‌های پشتیبانی‌شده</h2>
          <p className="text-gray-500 text-sm">
            نوبتیک برای طیف گسترده‌ای از کسب‌وکارهای خدماتی طراحی شده است:
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <span
                key={c}
                className="bg-cyan-50 text-cyan-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-cyan-100"
              >
                {c}
              </span>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-gradient-to-l from-cyan-600 to-cyan-500 rounded-2xl p-8 text-center text-white space-y-4">
          <h2 className="text-xl font-bold">آماده‌اید شروع کنید؟</h2>
          <p className="text-cyan-100 text-sm">
            همین الان کسب‌وکار خود را ثبت کنید و اولین نوبت آنلاین را دریافت کنید.
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-cyan-600 font-bold text-sm px-6 py-2.5 rounded-xl shadow hover:shadow-md transition-all"
            >
              ثبت کسب‌وکار — رایگان
            </button>
            <button
              onClick={() => navigate('/providers')}
              className="border border-white/40 text-white font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-white/10 transition-all"
            >
              مشاهده کسب‌وکارها
            </button>
          </div>
        </section>

      </div>
    </MainLayout>
  )
}
