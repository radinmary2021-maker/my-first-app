/**
 * Nobatic – Homepage
 * Universal business booking SaaS — not healthcare-specific
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useProviders } from '../../hooks/useDoctors'
import DoctorCard from '../../components/DoctorCard'
import Logo from '../../components/Logo'

/* ════════════════════════════════════════════════════
   Tiny SVG helpers
════════════════════════════════════════════════════ */
function Svg({ children, size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color}
         strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
         width={size} height={size} className={className} aria-hidden="true">
      {children}
    </svg>
  )
}
const SearchIcon = () => <Svg><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>
const CheckIcon  = ({ c }) => <Svg color={c}><polyline points="20 6 9 17 4 12"/></Svg>
const CalIcon    = ({ c }) => (
  <Svg color={c} size={22}>
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </Svg>
)
const ArrowLeft = () => (
  <Svg size={18}>
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </Svg>
)
function StarIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
         fill={filled ? '#F59E0B' : 'none'} stroke="#F59E0B"
         strokeWidth="1.8" aria-hidden="true">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>
    </svg>
  )
}

/* ════════════════════════════════════════════════════
   Image URL builder — Lorem Picsum (picsum.photos)
   Free CDN backed by Unsplash contributors. No API key
   required. Seed keeps each slot deterministic across
   reloads. Swap for Unsplash API once a key is available.
════════════════════════════════════════════════════ */
const IMG = (seed, w = 400, h = 300) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`

/* ════════════════════════════════════════════════════
   Business-themed background pattern
════════════════════════════════════════════════════ */
function BusinessPattern() {
  const S  = '#3BBDD4'
  const sw = 2
  return (
    <svg
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      viewBox="0 0 1200 460"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke={S}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="translate(1010,14) rotate(8) scale(2.0)" opacity=".24" strokeWidth={sw}>
        <rect x="0" y="8" width="50" height="44" rx="5"/>
        <line x1="0" y1="19" x2="50" y2="19"/>
        <line x1="12" y1="0" x2="12" y2="16"/><line x1="38" y1="0" x2="38" y2="16"/>
        <line x1="0" y1="29" x2="50" y2="29"/><line x1="0" y1="39" x2="50" y2="39"/>
        <line x1="17" y1="19" x2="17" y2="52"/><line x1="33" y1="19" x2="33" y2="52"/>
      </g>
      <g transform="translate(55,305) rotate(-5) scale(1.4)" opacity=".2" strokeWidth={sw}>
        <rect x="0" y="8" width="50" height="44" rx="5"/>
        <line x1="0" y1="19" x2="50" y2="19"/>
        <line x1="12" y1="0" x2="12" y2="16"/><line x1="38" y1="0" x2="38" y2="16"/>
        <line x1="0" y1="29" x2="50" y2="29"/>
        <line x1="17" y1="19" x2="17" y2="52"/>
      </g>
      <g transform="translate(1120,195) scale(1.8)" opacity=".2" strokeWidth={sw}>
        <circle cx="20" cy="20" r="18"/>
        <line x1="20" y1="20" x2="20" y2="7" strokeWidth={sw + .5}/>
        <line x1="20" y1="20" x2="30" y2="26"/>
        <circle cx="20" cy="20" r="2.5" fill={S}/>
      </g>
      <g transform="translate(28,45) scale(1.25)" opacity=".18" strokeWidth={sw}>
        <circle cx="20" cy="20" r="18"/>
        <line x1="20" y1="20" x2="20" y2="7"/>
        <line x1="20" y1="20" x2="29" y2="26"/>
        <circle cx="20" cy="20" r="2" fill={S}/>
      </g>
      <g transform="translate(756,32) scale(1.4)" opacity=".19" strokeWidth={sw}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </g>
      <g transform="translate(72,190) scale(1.05)" opacity=".17" strokeWidth={sw}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </g>
      <g transform="translate(882,368) scale(1.8)" opacity=".2" strokeWidth={sw}>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="7,12 10,15 17,8"/>
      </g>
      <g transform="translate(518,16) scale(1.3)" opacity=".17" strokeWidth={sw}>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="7,12 10,15 17,8"/>
      </g>
      <g transform="translate(305,355) scale(1.5)" opacity=".17" strokeWidth={sw - .3}>
        <line x1="12" y1="2"  x2="12" y2="22"/>
        <line x1="2"  y1="12" x2="22" y2="12"/>
        <line x1="5"  y1="5"  x2="19" y2="19" opacity=".55"/>
        <line x1="19" y1="5"  x2="5"  y2="19" opacity=".55"/>
      </g>
      <g transform="translate(895,20) rotate(10) scale(1.6)" opacity=".2" strokeWidth={sw}>
        <path d="M6 10 C6 6 9 3 12 3 C15 3 18 6 18 10 L18 17 L4 17 Z"/>
        <line x1="10" y1="17" x2="14" y2="17"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
      </g>
      <g transform="translate(190,385) scale(1.4)" opacity=".17" strokeWidth={sw}>
        <rect x="2" y="2" width="20" height="16" rx="3"/>
        <path d="M6 22 L2 18 L8 18"/>
        <line x1="6" y1="8"  x2="18" y2="8"/>
        <line x1="6" y1="12" x2="14" y2="12"/>
      </g>
      <g transform="translate(460,390) scale(1.2)" opacity=".17" strokeWidth={sw}>
        <circle cx="12" cy="8" r="5"/>
        <path d="M3 21 C3 16 7 13 12 13 C17 13 21 16 21 21"/>
      </g>
      {[
        [160,400],[700,350],[450,80],[1150,350],[250,130],[1000,420],
        [580,390],[820,60],[100,280],[350,160],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={6} opacity=".17" strokeWidth={sw}/>
      ))}
    </svg>
  )
}

/* ════════════════════════════════════════════════════
   Static data
════════════════════════════════════════════════════ */

/**
 * Category cards — Unsplash photo IDs (hotlink permitted, free to use).
 * Photo selection: one well-known Unsplash photo per category.
 * URL format: https://images.unsplash.com/{id}?auto=format&fit=crop&w=400&h=300&q=80
 */
const CATEGORIES = [
  { label: 'آرایش و زیبایی',     slug: 'beauty',        seed: 'hair-salon'     },
  { label: 'ورزش و تناسب اندام', slug: 'fitness',       seed: 'gym-fitness'    },
  { label: 'آموزش و تدریس',      slug: 'education',     seed: 'classroom'      },
  { label: 'عکاسی و فیلم',       q:    'عکاسی',         seed: 'camera-studio'  },
  { label: 'مشاوره تخصصی',       slug: 'psychological', seed: 'business-meeting'},
  { label: 'حیوانات خانگی',      slug: 'veterinary',    seed: 'vet-pet-dog'    },
  { label: 'آشپزی و شیرینی',     q:    'آشپزی',         seed: 'kitchen-baking' },
  { label: 'خدمات تخصصی',        slug: 'automotive',    seed: 'car-mechanic'   },
]

/**
 * Hero carousel slides — 5 real business photo examples.
 * Shows the diversity of bookable businesses on the platform.
 */
const CAROUSEL_SLIDES = [
  { seed: 'hair-salon-beauty',  label: 'آرایش و زیبایی',   sub: 'رزرو آنلاین نوبت آرایش'         },
  { seed: 'gym-barbell-woman',  label: 'باشگاه ورزشی',     sub: 'سانس تمرین را رزرو کنید'        },
  { seed: 'doctor-stethoscope', label: 'خدمات پزشکی',      sub: 'با بهترین متخصصان ملاقات کنید'  },
  { seed: 'car-garage-mechanic',label: 'تعمیرگاه خودرو',   sub: 'نوبت سرویس بدون انتظار'         },
  { seed: 'photo-studio-camera',label: 'استودیو عکاسی',    sub: 'رزرو سانس عکاسی حرفه‌ای'        },
]

/**
 * Testimonials — fictional placeholder reviews.
 * These are sample content for demo purposes, not real user data.
 */
const TESTIMONIALS = [
  {
    initial: 'ن', color: '#06B6D4', bg: '#ECFEFF',
    name: 'نوید. ک', role: 'مشتری آرایشگاه', stars: 5,
    text: 'خیلی ساده و راحت نوبت گرفتم. دیگه نیازی نیست زنگ بزنم و منتظر بمونم. هر موقع خواستم از گوشیم رزرو می‌کنم.',
  },
  {
    initial: 'س', color: '#10B981', bg: '#ECFDF5',
    name: 'سارا. م', role: 'صاحب آرایشگاه', stars: 5,
    text: 'از وقتی Nobatic استفاده می‌کنم نوبت‌هام ۴۰٪ بیشتر شده. مشتری‌ها راحت‌تر رزرو می‌کنند و غیبت کمتری داریم.',
  },
  {
    initial: 'ر', color: '#F59E0B', bg: '#FFFBEB',
    name: 'رضا. ش', role: 'مربی باشگاه ورزشی', stars: 5,
    text: 'مدیریت سانس‌های تمرین خیلی آسون‌تر شده. شاگردهام خودشون ساعت رو انتخاب می‌کنن و وقتم بهینه‌تر مدیریت می‌شه.',
  },
  {
    initial: 'آ', color: '#8B5CF6', bg: '#F5F3FF',
    name: 'آرزو. ت', role: 'مشتری کلینیک مشاوره', stars: 4,
    text: 'پلتفرم خیلی کاربردی و ساده‌ست. سیستم پرداخت آنلاین هم خیالم رو راحت کرد. حتماً به دوستام معرفی می‌کنم.',
  },
]

const TRUST = [
  { value: '+۱٬۰۰۰', label: 'کسب‌وکار فعال',  sub: 'در دسته‌بندی‌های مختلف' },
  { value: '+۵۰٬۰۰۰', label: 'نوبت موفق',       sub: 'ثبت‌شده در سامانه'      },
  { value: '۹۸٪',     label: 'رضایت مشتریان', sub: 'بر اساس نظرسنجی'        },
]

const STEPS = [
  {
    n: 1, ac: '#06B6D4', accentBg: '#ECFEFF',
    title: 'کسب‌وکار مناسب پیدا کن',
    desc: 'از میان صدها کسب‌وکار در حوزه‌های مختلف — آرایشگاه، باشگاه، آموزشگاه و بیشتر — انتخاب کن.',
  },
  {
    n: 2, ac: '#10B981', accentBg: '#ECFDF5',
    title: 'زمان دلخواهت رو انتخاب کن',
    desc: 'از تقویم آنلاین کسب‌وکار، اولین زمان خالی مناسبت رو ببین و رزرو کن — فقط چند ثانیه.',
  },
  {
    n: 3, ac: '#F59E0B', accentBg: '#FFFBEB',
    title: 'نوبت تأیید بگیر',
    desc: 'بعد از پرداخت آنلاین، پیامک تأیید نوبت فوری برات ارسال می‌شه. بدون انتظار تلفنی.',
  },
]

const OWNER_FEATURES = [
  { emoji: '📅', title: 'تقویم هوشمند',     desc: 'مدیریت همه نوبت‌ها در یک مکان، بدون نیاز به دفتر کاغذی.' },
  { emoji: '📱', title: 'رزرو از هر دستگاه', desc: 'مشتریان از موبایل، تبلت یا لپ‌تاپ نوبت می‌گیرند.' },
  { emoji: '💳', title: 'پرداخت آنلاین',    desc: 'دریافت پیش‌پرداخت امن از مشتریان پیش از مراجعه.' },
  { emoji: '🔔', title: 'پیامک خودکار',      desc: 'یادآوری اتوماتیک به مشتریان — غیبت‌ها کاهش می‌یابد.' },
]

/* ════════════════════════════════════════════════════
   Animations & utility CSS
════════════════════════════════════════════════════ */
const CSS = `
@keyframes nvUp {
  from { opacity:0; transform:translateY(22px) }
  to   { opacity:1; transform:translateY(0)    }
}
.nv0 { animation: nvUp .55s ease-out .00s both }
.nv1 { animation: nvUp .55s ease-out .10s both }
.nv2 { animation: nvUp .55s ease-out .20s both }
.nv3 { animation: nvUp .55s ease-out .30s both }

.nv-input:focus {
  border-color:#06B6D4 !important;
  background:#fff !important;
  box-shadow:0 0 0 3px rgba(8,145,178,.14);
}

/* Category photo cards */
.nv-cat-card { transition:transform .2s, box-shadow .2s }
.nv-cat-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,.18) }
.nv-cat-card:hover .nv-cat-img { transform:scale(1.07) }
.nv-cat-img { transition:transform .4s ease }

/* Feature cards */
.nv-feat { transition:transform .2s, box-shadow .2s }
.nv-feat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.08) }

/* Testimonial cards */
.nv-testimonial { transition:transform .2s, box-shadow .2s }
.nv-testimonial:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,.10) }

/* Carousel fade-in */
@keyframes carouselFade {
  from { opacity:0 }
  to   { opacity:1 }
}
.nv-carousel-active { animation: carouselFade .5s ease }

/* Carousel arrow hover */
.nv-carousel-arrow:hover { background:rgba(255,255,255,.35) !important }

/* Responsive */
@media(max-width:900px) {
  .nv-hero-grid { grid-template-columns:1fr !important }
  .nv-hero-carousel { max-height:260px }
}
@media(max-width:640px) {
  .nv-trust { grid-template-columns:1fr !important }
  .nv-cta-btns { flex-direction:column !important }
  .nv-cta-btns button { width:100% !important }
  .nv-owner-grid { grid-template-columns:1fr 1fr !important }
  .nv-testimonials-grid { grid-template-columns:1fr !important }
}
`

/* ════════════════════════════════════════════════════
   HeroCarousel — pure React/CSS, no external library
════════════════════════════════════════════════════ */
function HeroCarousel({ slides }) {
  const [active, setActive] = useState(0)
  const n = slides.length

  // Auto-rotate every 4.5 s; functional update avoids stale closure
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % n), 4500)
    return () => clearInterval(t)
  }, [n])

  const goTo = (i) => setActive((i + n) % n)

  return (
    <div
      className="nv-hero-carousel"
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,.25)',
        // Aspect ratio 16:10 — reliable across all modern browsers
        paddingBottom: '62.5%',
        height: 0,
      }}
    >
      {/* All images, only active one is visible */}
      {slides.map((s, i) => (
        <img
          key={s.seed}
          src={IMG(s.seed, 900, 562)}
          alt={s.label}
          loading={i === 0 ? 'eager' : 'lazy'}
          className={i === active ? 'nv-carousel-active' : ''}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            opacity: i === active ? 1 : 0,
            transition: 'opacity .55s ease',
          }}
        />
      ))}

      {/* Bottom gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,.68) 0%, rgba(0,0,0,.12) 45%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* Caption */}
      <div style={{
        position: 'absolute', bottom: 44, right: 18, left: 18,
        color: '#fff', textAlign: 'right',
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, opacity: .72, margin: '0 0 4px', letterSpacing: '0.4px' }}>
          {slides[active].sub}
        </p>
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,.4)' }}>
          {slides[active].label}
        </h3>
      </div>

      {/* Dots */}
      <div style={{
        position: 'absolute', bottom: 14, right: 0, left: 0,
        display: 'flex', justifyContent: 'center', gap: 5,
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`اسلاید ${i + 1}`}
            style={{
              width: i === active ? 22 : 7, height: 7, borderRadius: 4,
              background: i === active ? '#fff' : 'rgba(255,255,255,.42)',
              border: 'none', cursor: 'pointer', padding: 0,
              transition: 'all .3s ease',
            }}
          />
        ))}
      </div>

      {/* Prev arrow (right side in RTL = backward) */}
      <button
        onClick={() => goTo(active - 1)}
        aria-label="قبلی"
        className="nv-carousel-arrow"
        style={{
          position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.28)', color: '#fff',
          width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
          fontSize: 16, fontWeight: 700, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          transition: 'background .2s',
        }}
      >
        ›
      </button>

      {/* Next arrow (left side in RTL = forward) */}
      <button
        onClick={() => goTo(active + 1)}
        aria-label="بعدی"
        className="nv-carousel-arrow"
        style={{
          position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.28)', color: '#fff',
          width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
          fontSize: 16, fontWeight: 700, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          transition: 'background .2s',
        }}
      >
        ‹
      </button>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   Component
════════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate             = useNavigate()
  const user                 = useAuthStore((s) => s.user)
  const [search, setSearch]  = useState('')
  const { data: providers }  = useProviders()
  const featured             = providers?.slice(0, 3) ?? []

  function go(e) {
    e.preventDefault()
    navigate(search.trim() ? `/search?q=${encodeURIComponent(search.trim())}` : '/providers')
  }

  const hov = (enterStyle, leaveStyle) => ({
    onMouseEnter: (e) => Object.assign(e.currentTarget.style, enterStyle),
    onMouseLeave: (e) => Object.assign(e.currentTarget.style, leaveStyle),
  })

  return (
    <div dir="rtl" style={{ background: '#F8FAFC', color: '#1E293B', minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* ══ NAVBAR ══════════════════════════════════════ */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #F1F5F9',
        position: 'sticky', top: 0, zIndex: 30,
        height: 64, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 24px',
      }}>
        <Logo size={36} textSize={18} />

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => navigate('/providers')}
            style={{
              color: '#475569', fontSize: 14, fontWeight: 500, padding: '7px 14px',
              borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
            }}
            {...hov({ background: '#F8FAFC' }, { background: 'transparent' })}
          >
            کسب‌وکارها
          </button>
          <button
            onClick={() => navigate(user
              ? (user.role === 'provider' || user.role === 'owner' ? '/dashboard' : '/my-appointments')
              : '/login'
            )}
            style={{
              background: '#06B6D4', color: '#fff', fontSize: 14, fontWeight: 600,
              padding: '8px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
            {...hov({ opacity: '.88' }, { opacity: '1' })}
          >
            {user
              ? (user.role === 'provider' || user.role === 'owner' ? 'داشبورد' : 'نوبت‌های من')
              : 'ورود / ثبت‌نام'}
          </button>
        </nav>
      </header>

      {/* ══ HERO — two-column: text (right) + carousel (left) ═══ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: '#DFF6FA',
        borderBottom: '1px solid #B2E8F0',
        padding: '56px 24px 64px',
      }}>
        <BusinessPattern />

        <div
          className="nv-hero-grid"
          style={{
            maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center',
          }}
        >
          {/* ── Text column ── */}
          <div>
            <div className="nv0" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 22,
              background: 'rgba(255,255,255,.75)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(59,189,212,.4)', borderRadius: 100,
              padding: '7px 18px', fontSize: 12, fontWeight: 700, color: '#1178A0',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1EA8C4', flexShrink: 0 }}/>
              رزرو آنلاین نوبت برای هر کسب‌وکاری
            </div>

            <h1 className="nv1" style={{
              fontSize: 'clamp(1.7rem,3.5vw,2.6rem)', fontWeight: 900,
              lineHeight: 1.35, color: '#0C2D3A', marginBottom: 16,
            }}>
              ارائه‌دهنده مناسب رو پیدا کن،
              <br/>
              <span style={{ color: '#1178A0' }}>آنلاین نوبت بگیر</span>
            </h1>

            <p className="nv2" style={{
              color: '#2D6A80', fontSize: 14, lineHeight: 1.9,
              marginBottom: 32, maxWidth: 480,
            }}>
              از آرایشگاه و باشگاه تا مشاوره و آموزش — هر خدمتی که نیاز داری،
              سریع و بدون انتظار تلفنی رزرو کن.
            </p>

            <form onSubmit={go} className="nv2" style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{
                    position: 'absolute', right: 14, top: '50%',
                    transform: 'translateY(-50%)', display: 'flex', color: '#94A3B8',
                  }}>
                    <SearchIcon/>
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="نام کسب‌وکار یا خدمت مورد نظر..."
                    className="nv-input"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'rgba(255,255,255,.85)', backdropFilter: 'blur(8px)',
                      border: '1.5px solid rgba(59,189,212,.35)', borderRadius: 14,
                      padding: '13px 46px 13px 14px', fontSize: 14, color: '#1E293B',
                      outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color .15s,box-shadow .15s,background .15s',
                    }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    background: '#1178A0', color: '#fff', border: 'none',
                    borderRadius: 14, padding: '0 22px', fontSize: 14,
                    fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    fontFamily: 'inherit', transition: 'background .15s',
                  }}
                  {...hov({ background: '#0891B2' }, { background: '#1178A0' })}
                >
                  جستجو
                </button>
              </div>
            </form>

            <div className="nv3" style={{
              display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
            }}>
              <span style={{ color: '#5BA3B8', fontSize: 12, paddingTop: 2 }}>جستجوی سریع:</span>
              {['آرایشگاه', 'باشگاه', 'مشاوره', 'آموزشگاه', 'عکاسی'].map((s) => (
                <button key={s} onClick={() => navigate(`/search?q=${encodeURIComponent(s)}`)}
                  style={{
                    background: 'rgba(255,255,255,.6)', border: '1px solid rgba(59,189,212,.35)',
                    borderRadius: 20, padding: '5px 14px', fontSize: 12,
                    fontWeight: 500, color: '#1178A0', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background .15s,border-color .15s',
                    backdropFilter: 'blur(4px)',
                  }}
                  {...hov(
                    { background: 'rgba(255,255,255,.9)', borderColor: 'rgba(59,189,212,.7)' },
                    { background: 'rgba(255,255,255,.6)', borderColor: 'rgba(59,189,212,.35)' }
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Carousel column ── */}
          <div className="nv1">
            <HeroCarousel slides={CAROUSEL_SLIDES} />
          </div>
        </div>
      </section>

      {/* ══ TRUST BAR ═══════════════════════════════════ */}
      <section style={{ background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          <div className="nv-trust" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}>
            {TRUST.map((t, i) => (
              <div key={t.label} style={{
                padding: '32px 24px', textAlign: 'center',
                borderRight: i < TRUST.length - 1 ? '1px solid #F1F5F9' : 'none',
              }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#06B6D4', letterSpacing: '-0.5px', marginBottom: 4 }}>
                  {t.value}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: '#94A3B8' }}>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CATEGORIES — photo cards ════════════════════ */}
      <section style={{ padding: '64px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <SectionHeader
            title="دسته‌بندی‌های محبوب"
            sub="حوزه خدمتی که نیاز داری رو انتخاب کن"
            actionLabel="مشاهده همه کسب‌وکارها"
            onAction={() => navigate('/providers')}
          />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))',
            gap: 14,
          }}>
            {CATEGORIES.map(({ label, slug, q, seed }) => (
              <button
                key={label}
                className="nv-cat-card"
                onClick={() => {
                  if (slug) navigate(`/providers?category=${slug}`)
                  else if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
                  else navigate('/providers')
                }}
                style={{
                  position: 'relative',
                  display: 'block',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  background: '#E2E8F0',
                  boxShadow: '0 2px 8px rgba(0,0,0,.07)',
                }}
              >
                {/* Photo */}
                <img
                  src={IMG(seed, 400, 300)}
                  alt={label}
                  loading="lazy"
                  className="nv-cat-img"
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  }}
                />
                {/* Dark gradient overlay for text legibility */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,.72) 0%, rgba(0,0,0,.18) 55%, transparent 100%)',
                }} />
                {/* Label */}
                <span style={{
                  position: 'absolute', bottom: 0, right: 0, left: 0,
                  padding: '10px 8px 12px',
                  color: '#fff', fontSize: 11, fontWeight: 700,
                  textAlign: 'center', lineHeight: 1.35,
                }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURED PROVIDERS ══════════════════════════ */}
      {featured.length > 0 && (
        <section style={{ background: '#fff', borderTop: '1px solid #F1F5F9', padding: '64px 0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
            <SectionHeader
              title="ارائه‌دهندگان برتر"
              sub="با بالاترین رضایت مشتریان"
              actionLabel="مشاهده همه"
              onAction={() => navigate('/providers')}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
              {featured.map((p) => <DoctorCard key={p.id} provider={p}/>)}
            </div>
          </div>
        </section>
      )}

      {/* ══ HOW IT WORKS ════════════════════════════════ */}
      <section style={{ padding: '64px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <SectionHeader title="چطور کار می‌کند؟" sub="در سه گام ساده نوبت بگیر"/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{
                background: '#fff', border: '1px solid #F1F5F9', borderRadius: 20,
                padding: '32px 28px', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                position: 'relative', overflow: 'hidden',
              }}>
                <span style={{
                  position: 'absolute', top: 16, left: 20, fontSize: 64,
                  fontWeight: 900, color: '#F8FAFC', lineHeight: 1, userSelect: 'none',
                }}>
                  {s.n}
                </span>
                <div style={{
                  background: s.accentBg, borderRadius: 14, width: 52, height: 52,
                  marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {s.n === 1 && <SearchIcon/>}
                  {s.n === 2 && <CalIcon c={s.ac}/>}
                  {s.n === 3 && <CheckIcon c={s.ac}/>}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.85, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOR BUSINESS OWNERS ═════════════════════════ */}
      <section style={{ padding: '64px 0', background: '#fff', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <span style={{
                display: 'inline-block', background: '#ECFEFF', color: '#0891B2',
                fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 100,
                marginBottom: 20, border: '1px solid #CFFAFE',
              }}>
                برای صاحبان کسب‌وکار
              </span>
              <h2 style={{ fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 900, color: '#0F172A', lineHeight: 1.4, marginBottom: 16 }}>
                کسب‌وکار خود را<br/>
                <span style={{ color: '#06B6D4' }}>آنلاین کنید</span>
              </h2>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.9, marginBottom: 28 }}>
                با Nobatic سیستم نوبت‌دهی آنلاین حرفه‌ای برای کسب‌وکارتان راه‌اندازی کنید.
                مشتریان شما ۲۴ ساعته نوبت می‌گیرند — بدون تماس تلفنی.
              </p>
              <button
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                style={{
                  background: '#06B6D4', color: '#fff', border: 'none', borderRadius: 12,
                  padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(8,145,178,.22)', transition: 'background .15s,transform .15s',
                }}
                {...hov(
                  { background: '#0891B2', transform: 'translateY(-1px)' },
                  { background: '#06B6D4', transform: 'translateY(0)' }
                )}
              >
                رایگان شروع کنید
                <ArrowLeft/>
              </button>
            </div>
            <div className="nv-owner-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {OWNER_FEATURES.map((f) => (
                <div key={f.title} className="nv-feat" style={{
                  background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 16,
                  padding: '20px 18px', boxShadow: '0 1px 3px rgba(0,0,0,.05)',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{f.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════ */}
      <section style={{ padding: '64px 0', background: '#F8FAFC', borderTop: '1px solid #F1F5F9' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <SectionHeader
            title="نظرات کاربران ما"
            sub="تجربه واقعی مشتریان و کسب‌وکارهای Nobatic — نمونه محتوا"
          />
          <div
            className="nv-testimonials-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}
          >
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="nv-testimonial" style={{
                background: '#fff', borderRadius: 20, padding: '24px 20px',
                border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(0,0,0,.05)',
              }}>
                {/* Stars */}
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarIcon key={i} filled={i < t.stars} />
                  ))}
                </div>
                {/* Review text */}
                <p style={{
                  fontSize: 13, color: '#475569', lineHeight: 1.85,
                  margin: '0 0 18px', fontStyle: 'italic',
                }}>
                  «{t.text}»
                </p>
                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: t.bg, color: t.color, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800,
                    border: `2px solid ${t.color}30`,
                  }}>
                    {t.initial}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════ */}
      <section style={{ padding: '0 24px 72px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg,#0891B2 0%,#06B6D4 55%,#22D3EE 100%)',
            borderRadius: 24, padding: '56px 48px', textAlign: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }}/>
            <div style={{ position: 'absolute', bottom: -40, left: -40, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }}/>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
                آماده‌اید نوبت بگیرید؟
              </h2>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14, marginBottom: 28 }}>
                همین الان کسب‌وکار مناسب خودت رو پیدا کن و نوبت آنلاین رزرو کن
              </p>
              <div className="nv-cta-btns" style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/providers')}
                  style={{
                    background: '#fff', color: '#06B6D4', border: 'none', borderRadius: 12,
                    padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(0,0,0,.12)',
                    transition: 'transform .15s,box-shadow .15s',
                  }}
                  {...hov(
                    { transform: 'translateY(-1px)', boxShadow: '0 8px 24px rgba(0,0,0,.16)' },
                    { transform: 'translateY(0)',    boxShadow: '0 4px 16px rgba(0,0,0,.12)' }
                  )}
                >
                  رزرو نوبت
                </button>
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/login')}
                  style={{
                    background: 'transparent', color: '#fff',
                    border: '1.5px solid rgba(255,255,255,.4)', borderRadius: 12,
                    padding: '13px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'border-color .15s,background .15s',
                  }}
                  {...hov(
                    { borderColor: 'rgba(255,255,255,.8)', background: 'rgba(255,255,255,.08)' },
                    { borderColor: 'rgba(255,255,255,.4)', background: 'transparent' }
                  )}
                >
                  {user ? 'داشبورد من' : 'ثبت کسب‌وکار'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════ */}
      <footer style={{
        borderTop: '1px solid #F1F5F9', background: '#fff',
        padding: '28px 24px', textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <Logo size={28} textSize={15} />
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>
          © ۱۴۰۴ Nobatic — تمامی حقوق محفوظ است
        </p>
      </footer>
    </div>
  )
}

/* ════════════════════════════════════════════════════
   Section header
════════════════════════════════════════════════════ */
function SectionHeader({ title, sub, actionLabel, onAction }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 32, flexWrap: 'wrap', gap: 12,
    }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>{title}</h2>
        {sub && <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>{sub}</p>}
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          style={{
            background: '#ECFEFF', color: '#06B6D4', border: 'none', borderRadius: 8,
            padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'background .15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#CFFAFE' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#ECFEFF' }}
        >
          {actionLabel} ←
        </button>
      )}
    </div>
  )
}
