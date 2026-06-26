import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import SEOHead from '../../components/SEOHead'

const VALUES = [
  {
    title: 'سرعت و سادگی', desc: 'رزرو نوبت در کمتر از یک دقیقه، بدون تلفن و انتظار.',
    gradBg: 'linear-gradient(135deg, #00D4C8, #00A8FF)',
    icon: <><path d="m13 2-3 7h6l-3 13M5 7l3-5M16 7l3-5" /></>,
  },
  {
    title: 'امنیت اطلاعات', desc: 'اطلاعات شما با بالاترین استانداردهای امنیتی محافظت می‌شود.',
    gradBg: 'linear-gradient(135deg, #A855F7, #7C3AED)',
    icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    title: 'اعتماد و شفافیت', desc: 'نظرات واقعی کاربران، قیمت‌های شفاف، بدون هزینه پنهان.',
    gradBg: 'linear-gradient(135deg, #39FF14, #00D4C8)',
    icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m22 21-3-3 3-3" /></>,
  },
  {
    title: 'دسترسی همیشگی', desc: 'از هر دستگاه و هر مکان به خدمات نوبتیک دسترسی داشته باشید.',
    gradBg: 'linear-gradient(135deg, #FF6B2B, #FF4500)',
    icon: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></>,
  },
]

const STATS = [
  { value: '۱,۰۰۰+', label: 'کسب‌وکار فعال', grad: 'linear-gradient(135deg,#00D4C8,#00A8FF)' },
  { value: '۵۰,۰۰۰+', label: 'نوبت موفق', grad: 'linear-gradient(135deg,#A855F7,#7C3AED)' },
  { value: '۹۸٪', label: 'رضایت مشتری', grad: 'linear-gradient(135deg,#39FF14,#00D4C8)' },
  { value: '۲۴/۷', label: 'پشتیبانی', grad: 'linear-gradient(135deg,#FF6B2B,#FF4500)' },
]

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <MainLayout fullWidth>
      <SEOHead
        title="درباره نوبتیک"
        description="نوبتیک پلتفرم رزرو آنلاین نوبت برای هر کسب‌وکاری است — از آرایشگاه و باشگاه تا مشاوره و آموزشگاه."
        canonical="/about"
      />

      {/* Hero */}
      <section className="pt-12 pb-16 px-4 text-center grid-bg"
               style={{ background: '#0D1520' }}>
        <div className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold mb-5"
             style={{ background: 'rgba(0,212,200,0.1)', color: '#00D4C8', border: '1px solid rgba(0,212,200,0.2)' }}>
          درباره نوبتیک
        </div>
        <h1 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: '#DCF0F5' }}>
          رزرو آنلاین نوبت،
          <br />
          <span style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            برای هر کسب‌وکاری
          </span>
        </h1>
        <p className="leading-8 max-w-xl mx-auto" style={{ color: '#4A6E8A' }}>
          نوبتیک یک پلتفرم رزرو آنلاین نوبت است که کسب‌وکارها و مشتریان را به هم متصل می‌کند.
        </p>
      </section>

      {/* Stats */}
      <section className="py-6" style={{ background: '#132030', borderTop: '1px solid rgba(0,212,200,0.07)', borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
        <div className="max-w-3xl mx-auto px-4 grid grid-cols-4 gap-4 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-xl sm:text-2xl font-black"
                   style={{ background: s.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {s.value}
              </div>
              <div className="text-[11px] mt-1" style={{ color: '#4A6E8A' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-14">

        {/* Story */}
        <section>
          <h2 className="text-xl font-black mb-4 text-center"
              style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            داستان ما
          </h2>
          <div className="rounded-2xl p-6 sm:p-8 leading-8 text-sm"
               style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.07)', color: '#4A6E8A' }}>
            <p className="mb-4">
              ما در نوبتیک باور داریم که وقت شما ارزشمندترین دارایی شماست. به همین دلیل پلتفرمی ساختیم که
              رزرو نوبت را به یک تجربه سریع، ساده و قابل اعتماد تبدیل کند.
            </p>
            <p>
              با نوبتیک، کسب‌وکارها می‌توانند نوبت‌های خود را مدیریت کنند و به مشتریان بیشتری دسترسی داشته باشند.
            </p>
          </div>
        </section>

        {/* Values */}
        <section>
          <h2 className="text-xl font-black mb-8 text-center"
              style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ارزش‌های ما
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-2xl p-5 flex gap-4
                          hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group"
                   style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.07)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                                transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6"
                     style={{ background: v.gradBg }}>
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{v.icon}</svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: '#DCF0F5' }}>{v.title}</h3>
                  <p className="text-xs leading-6" style={{ color: '#4A6E8A' }}>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl p-8 sm:p-12 text-center"
                 style={{ background: 'linear-gradient(135deg, #132030 0%, #1A2A3E 50%, #132030 100%)', border: '1px solid rgba(0,212,200,0.12)' }}>
          <h2 className="text-2xl font-black mb-3"
              style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            آماده‌اید شروع کنید؟
          </h2>
          <p className="mb-6" style={{ color: '#4A6E8A' }}>همین حالا کسب‌وکار خود را در نوبتیک ثبت کنید</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={() => navigate('/login')}
                    className="text-white font-bold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}>
              شروع رایگان
            </button>
            <button onClick={() => navigate('/')}
                    className="font-bold px-6 py-3 rounded-xl text-sm transition-colors"
                    style={{ border: '1px solid rgba(0,212,200,0.3)', color: '#00D4C8', background: 'transparent' }}>
              بازگشت به خانه
            </button>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}
