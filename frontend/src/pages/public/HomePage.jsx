/**
 * Nobatic – Homepage
 * Universal business booking SaaS — not healthcare-specific
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useProviders } from '../../hooks/useDoctors'
import DoctorCard from '../../components/DoctorCard'

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

/* ════════════════════════════════════════════════════
   Business category illustrations — clean, minimal SVGs
════════════════════════════════════════════════════ */
function IllBg({ fill, children }) {
  return (
    <svg viewBox="0 0 80 80" width="84" height="84" fill="none" aria-hidden="true">
      <circle cx="40" cy="40" r="38" fill={fill}/>
      {children}
    </svg>
  )
}

/* آرایش و زیبایی — Scissors */
function ScissorsIll() {
  return (
    <IllBg fill="#FDF2F8">
      <circle cx="27" cy="28" r="9" stroke="#EC4899" strokeWidth="3"/>
      <circle cx="53" cy="28" r="9" stroke="#EC4899" strokeWidth="3"/>
      <line x1="33" y1="34" x2="60" y2="66" stroke="#EC4899" strokeWidth="3" strokeLinecap="round"/>
      <line x1="47" y1="34" x2="20" y2="66" stroke="#EC4899" strokeWidth="3" strokeLinecap="round"/>
      <line x1="27" y1="19" x2="40" y2="44" stroke="#F9A8D4" strokeWidth="2" strokeLinecap="round"/>
      <line x1="53" y1="19" x2="40" y2="44" stroke="#F9A8D4" strokeWidth="2" strokeLinecap="round"/>
    </IllBg>
  )
}

/* ورزش و تناسب اندام — Dumbbell */
function DumbbellIll() {
  return (
    <IllBg fill="#ECFDF5">
      <rect x="13" y="33" width="11" height="14" rx="4" fill="#10B981"/>
      <rect x="56" y="33" width="11" height="14" rx="4" fill="#10B981"/>
      <rect x="19" y="29" width="7" height="22" rx="3" fill="#059669"/>
      <rect x="54" y="29" width="7" height="22" rx="3" fill="#059669"/>
      <rect x="26" y="36" width="28" height="8" rx="4" fill="#34D399"/>
      <rect x="15" y="36" width="4" height="4" rx="1" fill="rgba(255,255,255,0.45)"/>
      <rect x="61" y="36" width="4" height="4" rx="1" fill="rgba(255,255,255,0.45)"/>
    </IllBg>
  )
}

/* آموزش و تدریس — Open Book */
function BookIll() {
  return (
    <IllBg fill="#EEF2FF">
      <path d="M17 22 L40 30 L40 64 L17 55 Z" fill="#6366F1" opacity=".9"/>
      <path d="M63 22 L40 30 L40 64 L63 55 Z" fill="#818CF8" opacity=".8"/>
      <line x1="40" y1="30" x2="40" y2="64" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
      <line x1="22" y1="37" x2="37" y2="40" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="22" y1="43" x2="37" y2="46" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="22" y1="49" x2="34" y2="52" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="43" y1="37" x2="58" y2="34" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="43" y1="43" x2="58" y2="40" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="43" y1="49" x2="55" y2="46" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
    </IllBg>
  )
}

/* عکاسی و فیلم — Camera */
function CameraIll() {
  return (
    <IllBg fill="#FFFBEB">
      <rect x="11" y="27" width="58" height="38" rx="7" fill="#F59E0B" opacity=".9"/>
      <path d="M27 27 L33 18 L47 18 L53 27Z" fill="#D97706"/>
      <circle cx="40" cy="46" r="13" stroke="#FDE68A" strokeWidth="2" fill="rgba(255,255,255,0.18)"/>
      <circle cx="40" cy="46" r="8" fill="#1E293B" opacity=".65"/>
      <circle cx="40" cy="46" r="4.5" fill="#0F172A" opacity=".75"/>
      <circle cx="36" cy="43" r="2.5" fill="white" opacity=".55"/>
      <rect x="52" y="30" width="10" height="7" rx="2" fill="#FDE68A"/>
    </IllBg>
  )
}

/* مشاوره تخصصی — Chat bubbles */
function ConsultIll() {
  return (
    <IllBg fill="#F5F3FF">
      <rect x="11" y="17" width="38" height="26" rx="10" fill="#7C3AED" opacity=".85"/>
      <path d="M24 43 L17 52" stroke="#7C3AED" strokeWidth="3.5" strokeLinecap="round" opacity=".85"/>
      <rect x="31" y="35" width="38" height="26" rx="10" fill="#A78BFA" opacity=".7"/>
      <path d="M55 61 L62 69" stroke="#A78BFA" strokeWidth="3.5" strokeLinecap="round" opacity=".7"/>
      <circle cx="22" cy="30" r="2.5" fill="white" opacity=".8"/>
      <circle cx="30" cy="30" r="2.5" fill="white" opacity=".8"/>
      <circle cx="38" cy="30" r="2.5" fill="white" opacity=".8"/>
      <circle cx="41" cy="48" r="2.5" fill="white" opacity=".7"/>
      <circle cx="49" cy="48" r="2.5" fill="white" opacity=".7"/>
      <circle cx="57" cy="48" r="2.5" fill="white" opacity=".7"/>
    </IllBg>
  )
}

/* حیوانات خانگی — Paw print */
function PawIll() {
  return (
    <IllBg fill="#FFF7ED">
      <ellipse cx="40" cy="54" rx="16" ry="12" fill="#FB923C" opacity=".9"/>
      <ellipse cx="23" cy="37" rx="7" ry="8" fill="#FB923C" opacity=".8" transform="rotate(-20,23,37)"/>
      <ellipse cx="34" cy="30" rx="6" ry="8" fill="#FB923C" opacity=".85"/>
      <ellipse cx="46" cy="30" rx="6" ry="8" fill="#FB923C" opacity=".85"/>
      <ellipse cx="57" cy="37" rx="7" ry="8" fill="#FB923C" opacity=".8" transform="rotate(20,57,37)"/>
      <ellipse cx="38" cy="52" rx="5" ry="4" fill="rgba(255,255,255,0.3)"/>
    </IllBg>
  )
}

/* آشپزی و شیرینی — Chef hat */
function ChefIll() {
  return (
    <IllBg fill="#FFF1F2">
      <rect x="25" y="55" width="30" height="9" rx="3" fill="#E11D48" opacity=".75"/>
      <rect x="28" y="47" width="24" height="11" rx="2" fill="#FB7185" opacity=".65"/>
      <ellipse cx="40" cy="36" rx="17" ry="18" fill="white" stroke="#FDA4AF" strokeWidth="2"/>
      <ellipse cx="29" cy="37" rx="8" ry="10" fill="white" stroke="#FDA4AF" strokeWidth="1.5"/>
      <ellipse cx="51" cy="37" rx="8" ry="10" fill="white" stroke="#FDA4AF" strokeWidth="1.5"/>
      <path d="M35 64 Q33 69 35 74" stroke="#FDA4AF" strokeWidth="2" strokeLinecap="round"/>
      <path d="M40 64 Q38 69 40 74" stroke="#FDA4AF" strokeWidth="2" strokeLinecap="round"/>
      <path d="M45 64 Q43 69 45 74" stroke="#FDA4AF" strokeWidth="2" strokeLinecap="round"/>
    </IllBg>
  )
}

/* خدمات تخصصی — Wrench */
function WrenchIll() {
  return (
    <IllBg fill="#F1F5F9">
      <path d="M36 63 L56 23 Q64 13 69 19 Q75 25 65 31 L45 71 Q39 77 33 71 Q27 65 36 63Z"
            fill="#475569" opacity=".75"/>
      <path d="M36 63 L56 23 Q64 13 69 19"
            fill="none" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="65" cy="22" r="9" fill="none" stroke="#64748B" strokeWidth="4"/>
      <circle cx="65" cy="22" r="4" fill="#64748B"/>
      <path d="M39 56 L54 28" stroke="rgba(255,255,255,.3)" strokeWidth="3" strokeLinecap="round"/>
    </IllBg>
  )
}

/* ════════════════════════════════════════════════════
   Business-themed background pattern
   Abstract geometric: calendars, clocks, stars, checkmarks
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
      {/* ── Calendar large — top-right ── */}
      <g transform="translate(1010,14) rotate(8) scale(2.0)" opacity=".24" strokeWidth={sw}>
        <rect x="0" y="8" width="50" height="44" rx="5"/>
        <line x1="0" y1="19" x2="50" y2="19"/>
        <line x1="12" y1="0" x2="12" y2="16"/><line x1="38" y1="0" x2="38" y2="16"/>
        <line x1="0" y1="29" x2="50" y2="29"/><line x1="0" y1="39" x2="50" y2="39"/>
        <line x1="17" y1="19" x2="17" y2="52"/><line x1="33" y1="19" x2="33" y2="52"/>
      </g>

      {/* ── Calendar small — bottom-left ── */}
      <g transform="translate(55,305) rotate(-5) scale(1.4)" opacity=".2" strokeWidth={sw}>
        <rect x="0" y="8" width="50" height="44" rx="5"/>
        <line x1="0" y1="19" x2="50" y2="19"/>
        <line x1="12" y1="0" x2="12" y2="16"/><line x1="38" y1="0" x2="38" y2="16"/>
        <line x1="0" y1="29" x2="50" y2="29"/>
        <line x1="17" y1="19" x2="17" y2="52"/>
      </g>

      {/* ── Clock — right side ── */}
      <g transform="translate(1120,195) scale(1.8)" opacity=".2" strokeWidth={sw}>
        <circle cx="20" cy="20" r="18"/>
        <line x1="20" y1="20" x2="20" y2="7" strokeWidth={sw + .5}/>
        <line x1="20" y1="20" x2="30" y2="26"/>
        <circle cx="20" cy="20" r="2.5" fill={S}/>
      </g>

      {/* ── Clock small — top-left ── */}
      <g transform="translate(28,45) scale(1.25)" opacity=".18" strokeWidth={sw}>
        <circle cx="20" cy="20" r="18"/>
        <line x1="20" y1="20" x2="20" y2="7"/>
        <line x1="20" y1="20" x2="29" y2="26"/>
        <circle cx="20" cy="20" r="2" fill={S}/>
      </g>

      {/* ── Star — top-right area ── */}
      <g transform="translate(756,32) scale(1.4)" opacity=".19" strokeWidth={sw}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </g>

      {/* ── Star small — left center ── */}
      <g transform="translate(72,190) scale(1.05)" opacity=".17" strokeWidth={sw}>
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
      </g>

      {/* ── Checkmark circle — bottom-right ── */}
      <g transform="translate(882,368) scale(1.8)" opacity=".2" strokeWidth={sw}>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="7,12 10,15 17,8"/>
      </g>

      {/* ── Checkmark circle — top center ── */}
      <g transform="translate(518,16) scale(1.3)" opacity=".17" strokeWidth={sw}>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="7,12 10,15 17,8"/>
      </g>

      {/* ── Sparkle / asterisk ── */}
      <g transform="translate(305,355) scale(1.5)" opacity=".17" strokeWidth={sw - .3}>
        <line x1="12" y1="2"  x2="12" y2="22"/>
        <line x1="2"  y1="12" x2="22" y2="12"/>
        <line x1="5"  y1="5"  x2="19" y2="19" opacity=".55"/>
        <line x1="19" y1="5"  x2="5"  y2="19" opacity=".55"/>
      </g>

      {/* ── Notification bell — top area ── */}
      <g transform="translate(895,20) rotate(10) scale(1.6)" opacity=".2" strokeWidth={sw}>
        <path d="M6 10 C6 6 9 3 12 3 C15 3 18 6 18 10 L18 17 L4 17 Z"/>
        <line x1="10" y1="17" x2="14" y2="17"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
      </g>

      {/* ── Chat bubble — bottom area ── */}
      <g transform="translate(190,385) scale(1.4)" opacity=".17" strokeWidth={sw}>
        <rect x="2" y="2" width="20" height="16" rx="3"/>
        <path d="M6 22 L2 18 L8 18"/>
        <line x1="6" y1="8"  x2="18" y2="8"/>
        <line x1="6" y1="12" x2="14" y2="12"/>
      </g>

      {/* ── User/person — center-left ── */}
      <g transform="translate(460,390) scale(1.2)" opacity=".17" strokeWidth={sw}>
        <circle cx="12" cy="8" r="5"/>
        <path d="M3 21 C3 16 7 13 12 13 C17 13 21 16 21 21"/>
      </g>

      {/* ── Small dots scattered ── */}
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
const CATEGORIES = [
  { label: 'آرایش و زیبایی',     Ill: ScissorsIll },
  { label: 'ورزش و تناسب اندام', Ill: DumbbellIll },
  { label: 'آموزش و تدریس',      Ill: BookIll     },
  { label: 'عکاسی و فیلم',       Ill: CameraIll   },
  { label: 'مشاوره تخصصی',       Ill: ConsultIll  },
  { label: 'حیوانات خانگی',      Ill: PawIll      },
  { label: 'آشپزی و شیرینی',     Ill: ChefIll     },
  { label: 'خدمات تخصصی',        Ill: WrenchIll   },
]

const TRUST = [
  { value: '+۱٬۰۰۰', label: 'کسب‌وکار فعال',   sub: 'در دسته‌بندی‌های مختلف' },
  { value: '+۵۰٬۰۰۰', label: 'نوبت موفق',        sub: 'ثبت‌شده در سامانه'       },
  { value: '۹۸٪',     label: 'رضایت مشتریان',   sub: 'بر اساس نظرسنجی'         },
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
   Animations
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
.nv-sp:hover { transform:translateY(-4px); box-shadow:0 8px 24px rgba(0,0,0,.10) }
.nv-sp { transition:transform .2s,box-shadow .2s }
.nv-feat:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.08) }
.nv-feat { transition:transform .2s,box-shadow .2s }

@media(max-width:640px){
  .nv-trust { grid-template-columns:1fr !important }
  .nv-cta-btns { flex-direction:column !important }
  .nv-cta-btns button { width:100% !important }
  .nv-owner-grid { grid-template-columns:1fr 1fr !important }
}
`

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
    navigate(search.trim() ? `/providers?q=${encodeURIComponent(search.trim())}` : '/providers')
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: '#06B6D4', borderRadius: 10, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(8,145,178,.3)',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" width="18" height="18" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span style={{ color: '#06B6D4', fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>
            Nobatic
          </span>
        </div>

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

      {/* ══ HERO ════════════════════════════════════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: '#DFF6FA',
        borderBottom: '1px solid #B2E8F0',
        padding: '72px 24px 80px',
      }}>
        <BusinessPattern />

        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>

          {/* Eyebrow pill */}
          <div className="nv0" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 24,
            background: 'rgba(255,255,255,.75)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(59,189,212,.4)', borderRadius: 100,
            padding: '7px 18px', fontSize: 12, fontWeight: 700, color: '#1178A0',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1EA8C4', flexShrink: 0 }}/>
            رزرو آنلاین نوبت برای هر کسب‌وکاری
          </div>

          {/* Headline */}
          <h1 className="nv1" style={{
            fontSize: 'clamp(1.9rem,4vw,2.8rem)', fontWeight: 900,
            lineHeight: 1.35, color: '#0C2D3A', marginBottom: 18,
          }}>
            ارائه‌دهنده مناسب رو پیدا کن،
            <br/>
            <span style={{ color: '#1178A0' }}>آنلاین نوبت بگیر</span>
          </h1>

          {/* Subtitle */}
          <p className="nv2" style={{
            color: '#2D6A80', fontSize: 15, lineHeight: 1.9,
            marginBottom: 40, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto',
          }}>
            از آرایشگاه و باشگاه تا مشاوره و آموزش — هر خدمتی که نیاز داری،
            سریع و بدون انتظار تلفنی رزرو کن.
          </p>

          {/* Search bar */}
          <form onSubmit={go} className="nv2" style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', gap: 10, maxWidth: 520, margin: '0 auto' }}>
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
                    padding: '14px 46px 14px 14px', fontSize: 14, color: '#1E293B',
                    outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color .15s,box-shadow .15s,background .15s',
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  background: '#1178A0', color: '#fff', border: 'none',
                  borderRadius: 14, padding: '0 24px', fontSize: 14,
                  fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: 'inherit', transition: 'background .15s',
                }}
                {...hov({ background: '#0891B2' }, { background: '#1178A0' })}
              >
                جستجو
              </button>
            </div>
          </form>

          {/* Quick category links */}
          <div className="nv3" style={{
            display: 'flex', flexWrap: 'wrap', gap: 8,
            justifyContent: 'center', alignItems: 'center',
          }}>
            <span style={{ color: '#5BA3B8', fontSize: 12, paddingTop: 2 }}>جستجوی سریع:</span>
            {['آرایشگاه', 'باشگاه', 'مشاوره', 'آموزشگاه', 'عکاسی'].map((s) => (
              <button key={s} onClick={() => navigate('/providers')}
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

      {/* ══ CATEGORIES ══════════════════════════════════ */}
      <section style={{ padding: '64px 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <SectionHeader
            title="دسته‌بندی‌های محبوب"
            sub="حوزه خدمتی که نیاز داری رو انتخاب کن"
            actionLabel="مشاهده همه کسب‌وکارها"
            onAction={() => navigate('/providers')}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 14 }}>
            {CATEGORIES.map(({ label, Ill }) => (
              <button
                key={label}
                className="nv-sp"
                onClick={() => navigate('/providers')}
                style={{
                  background: '#fff', border: '1px solid #F1F5F9', borderRadius: 20,
                  padding: '18px 8px 14px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 10, cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.05)',
                }}
              >
                <Ill/>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1E293B', lineHeight: 1.4 }}>{label}</span>
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

            {/* Left: text */}
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

            {/* Right: feature cards */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            background: '#06B6D4', borderRadius: 8, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                 strokeLinecap="round" strokeLinejoin="round" width="14" height="14" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <span style={{ fontWeight: 700, color: '#06B6D4', fontSize: 15 }}>Nobatic</span>
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
