import { useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import SEOHead from '../../components/SEOHead'

const CONTACT_CARDS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    label: 'ایمیل پشتیبانی',
    value: 'support@nobatiic.ir',
    sub: 'پاسخ در کمتر از ۲۴ ساعت',
    href: 'mailto:support@nobatiic.ir',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    label: 'تلفن پشتیبانی',
    value: '۰۲۱-XXXXXXXX',
    sub: 'شنبه تا چهارشنبه، ۹ تا ۱۷',
    href: 'tel:021XXXXXXXX',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'دفتر مرکزی',
    value: 'تهران، ایران',
    sub: 'پذیرش حضوری با هماهنگی قبلی',
    href: null,
  },
]

const FAQS = [
  {
    q: 'چطور می‌توانم کسب‌وکارم را در نوبتیک ثبت کنم؟',
    a: 'بعد از ثبت‌نام با شماره موبایل، از داشبورد گزینه "ثبت کسب‌وکار" را انتخاب کنید. فرآیند راه‌اندازی کمتر از ۱۰ دقیقه طول می‌کشد.',
  },
  {
    q: 'آیا استفاده از نوبتیک برای مشتریان رایگان است؟',
    a: 'بله — رزرو نوبت برای مشتریان کاملاً رایگان است. کسب‌وکارها می‌توانند در صورت تمایل پیش‌پرداخت از مشتری دریافت کنند.',
  },
  {
    q: 'اگر مشتری نوبتش را لغو کند چه اتفاقی می‌افتد؟',
    a: 'نوبت لغوشده فوری به تقویم بازمی‌گردد و برای رزرو مجدد در دسترس قرار می‌گیرد. اطلاع‌رسانی به کسب‌وکار از طریق پیامک انجام می‌شود.',
  },
  {
    q: 'آیا می‌توانم چند شعبه یا چند ارائه‌دهنده زیر یک حساب مدیریت کنم؟',
    a: 'بله — از طریق داشبورد می‌توانید چند ارائه‌دهنده با ساعت کاری و خدمات مجزا زیر یک کسب‌وکار تعریف کنید.',
  },
]

const SUBJECTS = [
  'پشتیبانی فنی',
  'ثبت کسب‌وکار',
  'سوال درباره پرداخت',
  'گزارش مشکل',
  'پیشنهاد و انتقاد',
  'سایر',
]

export default function ContactPage() {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <MainLayout>
      <SEOHead
        title="تماس با ما"
        description="با تیم پشتیبانی نوبتیک تماس بگیرید — ایمیل، تلفن، یا فرم آنلاین. سوالات متداول را هم می‌توانید اینجا بیابید."
        canonical="/contact"
      />

      <div dir="rtl" style={{ maxWidth: 860, margin: '0 auto' }} className="space-y-14 pb-10">

        {/* ── Hero ── */}
        <section style={{ background: '#ECFEFF', borderRadius: 20, padding: '52px 36px', textAlign: 'center', border: '1px solid #B2E8F0' }}>
          <span style={{
            display: 'inline-block', background: 'rgba(6,182,212,.12)',
            color: '#0891B2', fontSize: 12, fontWeight: 700,
            padding: '5px 16px', borderRadius: 100, marginBottom: 18,
            border: '1px solid rgba(6,182,212,.25)',
          }}>
            ارتباط با ما
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 900, color: '#0F172A', marginBottom: 14 }}>
            تماس با ما
          </h1>
          <p style={{ color: '#2D6A80', fontSize: 15, lineHeight: 1.9, maxWidth: 520, margin: '0 auto' }}>
            سوالی دارید؟ مشکلی پیش آمده؟ یا پیشنهادی برای بهتر شدن نوبتیک دارید؟
            تیم ما آماده شنیدن است.
          </p>
        </section>

        {/* ── Contact cards ── */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
            {CONTACT_CARDS.map((card) => {
              const inner = (
                <div style={{
                  background: '#fff', borderRadius: 16, border: '1px solid #E2F8FB',
                  padding: '24px 20px', boxShadow: '0 2px 8px rgba(6,182,212,.06)',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
                  transition: 'transform .18s, box-shadow .18s',
                  cursor: card.href ? 'pointer' : 'default',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: '#ECFEFF', color: '#06B6D4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #B2E8F0',
                  }}>
                    {card.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{card.label}</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{card.value}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8' }}>{card.sub}</p>
                  </div>
                </div>
              )

              return card.href ? (
                <a key={card.label} href={card.href} style={{ textDecoration: 'none', display: 'block' }}>
                  {inner}
                </a>
              ) : (
                <div key={card.label}>{inner}</div>
              )
            })}
          </div>
        </section>

        {/* ── Contact form ── */}
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>
            ارسال پیام
          </h2>

          {submitted ? (
            <div style={{
              background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 16,
              padding: '36px 28px', textAlign: 'center',
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', background: '#D1FAE5',
                margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" style={{ width: 26, height: 26 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#065F46', marginBottom: 8 }}>پیام شما ارسال شد!</p>
              <p style={{ fontSize: 13, color: '#047857' }}>در اولین فرصت با شما تماس خواهیم گرفت.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                style={{
                  marginTop: 20, background: '#10B981', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ارسال پیام جدید
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                background: '#fff', borderRadius: 20, border: '1px solid #E2F8FB',
                padding: '32px 28px', boxShadow: '0 2px 12px rgba(6,182,212,.06)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <Field
                  label="نام و نام خانوادگی"
                  name="name"
                  type="text"
                  placeholder="مثلاً: علی رضایی"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <Field
                  label="آدرس ایمیل"
                  name="email"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  موضوع
                </label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%', boxSizing: 'border-box', border: '1.5px solid #E2E8F0',
                    borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#1E293B',
                    background: '#F8FAFC', outline: 'none', fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  <option value="" disabled>یک موضوع انتخاب کنید</option>
                  {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                  متن پیام
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="پیام خود را اینجا بنویسید..."
                  style={{
                    width: '100%', boxSizing: 'border-box', border: '1.5px solid #E2E8F0',
                    borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#1E293B',
                    background: '#F8FAFC', outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                    lineHeight: 1.8,
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: '#06B6D4', color: '#fff', border: 'none', borderRadius: 12,
                  padding: '12px 32px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(6,182,212,.3)',
                  transition: 'background .15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#0891B2' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#06B6D4' }}
              >
                ارسال پیام
              </button>
            </form>
          )}
        </section>

        {/* ── FAQ ── */}
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>
            سوالات متداول
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {FAQS.map((faq, i) => (
              <div
                key={i}
                style={{
                  background: '#fff', borderRadius: 14,
                  border: `1.5px solid ${openFaq === i ? '#06B6D4' : '#E2F8FB'}`,
                  overflow: 'hidden', transition: 'border-color .15s',
                  boxShadow: openFaq === i ? '0 4px 16px rgba(6,182,212,.1)' : '0 1px 4px rgba(0,0,0,.04)',
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', background: 'transparent', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right',
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{faq.q}</span>
                  <svg
                    viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2"
                    style={{
                      width: 18, height: 18, flexShrink: 0, marginRight: 12,
                      transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform .2s',
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', fontSize: 13, color: '#475569', lineHeight: 1.9 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </MainLayout>
  )
}

function Field({ label, name, type, placeholder, value, onChange, required }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%', boxSizing: 'border-box', border: '1.5px solid #E2E8F0',
          borderRadius: 10, padding: '10px 12px', fontSize: 14, color: '#1E293B',
          background: '#F8FAFC', outline: 'none', fontFamily: 'inherit',
          transition: 'border-color .15s',
        }}
        onFocus={(e) => { e.target.style.borderColor = '#06B6D4'; e.target.style.background = '#fff' }}
        onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC' }}
      />
    </div>
  )
}
