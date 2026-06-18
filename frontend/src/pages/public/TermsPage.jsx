import { useEffect, useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import SEOHead from '../../components/SEOHead'

const LAST_UPDATED = '۱ تیر ۱۴۰۴'

const SECTIONS = [
  { id: 'definitions',     title: 'تعاریف' },
  { id: 'usage',           title: 'شرایط استفاده' },
  { id: 'user-rights',     title: 'حقوق و تکالیف کاربران' },
  { id: 'business-rights', title: 'حقوق و تکالیف کسب‌وکارها' },
  { id: 'privacy',         title: 'حریم خصوصی' },
  { id: 'payment',         title: 'پرداخت و استرداد' },
  { id: 'liability',       title: 'محدودیت مسئولیت' },
  { id: 'changes',         title: 'تغییرات در قوانین' },
]

function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top: y, behavior: 'smooth' })
}

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    function onScroll() {
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= 100) {
          setActiveSection(s.id)
          return
        }
      }
      setActiveSection('')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <MainLayout>
      <SEOHead
        title="قوانین و مقررات"
        description="قوانین و مقررات استفاده از پلتفرم نوبتیک — شرایط استفاده، حریم خصوصی، پرداخت و استرداد، و حقوق کاربران و کسب‌وکارها."
        canonical="/terms"
      />

      <div dir="rtl" style={{ maxWidth: 960, margin: '0 auto' }} className="pb-12">

        {/* ── Hero ── */}
        <section style={{
          background: 'linear-gradient(135deg, #ECFEFF 0%, #F0F9FF 100%)',
          borderRadius: 20, padding: '48px 36px', marginBottom: 40,
          border: '1px solid #B2E8F0', textAlign: 'center',
        }}>
          <span style={{
            display: 'inline-block', background: 'rgba(6,182,212,.12)',
            color: '#0891B2', fontSize: 12, fontWeight: 700,
            padding: '5px 16px', borderRadius: 100, marginBottom: 16,
            border: '1px solid rgba(6,182,212,.25)',
          }}>
            مستندات حقوقی
          </span>
          <h1 style={{ fontSize: 'clamp(1.6rem,3vw,2.2rem)', fontWeight: 900, color: '#0F172A', marginBottom: 12 }}>
            قوانین و مقررات
          </h1>
          <p style={{ color: '#64748B', fontSize: 13 }}>
            آخرین بروزرسانی: <strong style={{ color: '#0891B2' }}>{LAST_UPDATED}</strong>
          </p>
          <p style={{ color: '#475569', fontSize: 14, lineHeight: 1.9, maxWidth: 560, margin: '16px auto 0' }}>
            استفاده از خدمات نوبتیک به منزله پذیرش کامل این قوانین است.
            لطفاً پیش از استفاده، این سند را با دقت مطالعه فرمایید.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 32, alignItems: 'start' }}>

          {/* ── Table of contents (sticky) ── */}
          <aside style={{ position: 'sticky', top: 80 }}>
            <div style={{
              background: '#fff', borderRadius: 16, border: '1px solid #E2F8FB',
              padding: '20px 16px', boxShadow: '0 2px 8px rgba(6,182,212,.06)',
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8', marginBottom: 12, letterSpacing: '0.5px' }}>
                فهرست مطالب
              </p>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    style={{
                      textAlign: 'right', background: activeSection === s.id ? '#ECFEFF' : 'transparent',
                      color: activeSection === s.id ? '#0891B2' : '#475569',
                      border: 'none', borderRadius: 8, padding: '7px 10px',
                      fontSize: 13, fontWeight: activeSection === s.id ? 700 : 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                      borderRight: activeSection === s.id ? '3px solid #06B6D4' : '3px solid transparent',
                      transition: 'all .15s',
                    }}
                  >
                    {s.title}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── Content ── */}
          <main style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>

              <Section id="definitions" title="۱. تعاریف">
                <p>در این سند، عبارات زیر به معانی ذکرشده به‌کار می‌روند:</p>
                <dl>
                  <Term t="نوبتیک / پلتفرم">شرکت ارائه‌دهنده خدمات رزرو آنلاین نوبت در آدرس nobatiic.ir</Term>
                  <Term t="کاربر">هر شخص حقیقی که با ثبت‌نام در پلتفرم از خدمات استفاده می‌کند.</Term>
                  <Term t="کسب‌وکار / ارائه‌دهنده">شخص حقیقی یا حقوقی که خدمات خود را از طریق نوبتیک ارائه می‌دهد.</Term>
                  <Term t="مشتری">کاربری که از کسب‌وکارها نوبت رزرو می‌کند.</Term>
                  <Term t="نوبت">زمان رزرو‌شده توسط مشتری برای دریافت خدمت از کسب‌وکار.</Term>
                  <Term t="خدمت">هر محصول یا سرویسی که کسب‌وکار از طریق پلتفرم ارائه می‌دهد.</Term>
                </dl>
              </Section>

              <Section id="usage" title="۲. شرایط استفاده">
                <p>برای استفاده از نوبتیک باید:</p>
                <ul>
                  <li>حداقل ۱۸ سال داشته باشید یا با رضایت ولی قانونی خود اقدام کنید.</li>
                  <li>اطلاعات صحیح و کامل ارائه دهید.</li>
                  <li>از شماره موبایل معتبر ایرانی برای احراز هویت استفاده کنید.</li>
                  <li>از ربات، اسکریپت، یا هر روش خودکار برای رزرو انبوه استفاده نکنید.</li>
                  <li>اقداماتی که امنیت یا عملکرد پلتفرم را به خطر می‌اندازد انجام ندهید.</li>
                </ul>
                <p>نوبتیک حق دارد در صورت نقض هر یک از موارد فوق، حساب کاربری را تعلیق یا حذف کند.</p>
              </Section>

              <Section id="user-rights" title="۳. حقوق و تکالیف کاربران">
                <h3>حقوق کاربران</h3>
                <ul>
                  <li>دسترسی به اطلاعات کامل کسب‌وکار پیش از رزرو</li>
                  <li>لغو نوبت طبق سیاست لغو هر کسب‌وکار</li>
                  <li>درخواست حذف حساب و داده‌های شخصی</li>
                  <li>دسترسی به تاریخچه کامل نوبت‌ها</li>
                  <li>ارسال شکایت از طریق تیم پشتیبانی</li>
                </ul>
                <h3>تکالیف کاربران</h3>
                <ul>
                  <li>حضور به موقع در زمان نوبت رزروشده</li>
                  <li>لغو نوبت در صورت عدم حضور، حداقل ۲ ساعت پیش از زمان مقرر</li>
                  <li>عدم سوءاستفاده از سیستم رزرو (رزرو‌های صوری)</li>
                  <li>رعایت احترام با کارکنان کسب‌وکار</li>
                </ul>
              </Section>

              <Section id="business-rights" title="۴. حقوق و تکالیف کسب‌وکارها">
                <h3>حقوق کسب‌وکارها</h3>
                <ul>
                  <li>تعریف خدمات، قیمت، و ساعات کاری به‌صورت مستقل</li>
                  <li>دریافت پیش‌پرداخت از مشتریان</li>
                  <li>لغو نوبت در شرایط اضطراری با اطلاع‌رسانی فوری</li>
                  <li>مسدودسازی کاربران متخلف پس از گزارش به نوبتیک</li>
                </ul>
                <h3>تکالیف کسب‌وکارها</h3>
                <ul>
                  <li>ارائه اطلاعات صحیح و به‌روز درباره خدمات</li>
                  <li>پایبندی به نوبت‌های تأییدشده</li>
                  <li>اطلاع‌رسانی فوری در صورت تغییر ساعات یا لغو</li>
                  <li>عدم دریافت وجه خارج از پلتفرم برای خدمات ثبت‌شده</li>
                  <li>رعایت قوانین جمهوری اسلامی ایران در ارائه خدمات</li>
                </ul>
              </Section>

              <Section id="privacy" title="۵. حریم خصوصی">
                <p>نوبتیک به حریم خصوصی کاربران احترام می‌گذارد. اطلاعات جمع‌آوری‌شده شامل:</p>
                <ul>
                  <li><strong>اطلاعات هویتی:</strong> نام، شماره موبایل (برای احراز هویت OTP)</li>
                  <li><strong>اطلاعات رزرو:</strong> تاریخ، ساعت، خدمت، و کسب‌وکار انتخابی</li>
                  <li><strong>اطلاعات فنی:</strong> آدرس IP، نوع مرورگر (برای امنیت)</li>
                </ul>
                <p>نوبتیک تعهد می‌دهد:</p>
                <ul>
                  <li>اطلاعات شخصی به اشخاص ثالث فروخته نشود.</li>
                  <li>اطلاعات فقط برای بهبود خدمات و اطلاع‌رسانی مرتبط استفاده شود.</li>
                  <li>در صورت درخواست کاربر، داده‌های شخصی ظرف ۳۰ روز حذف شود.</li>
                  <li>اطلاعات پرداخت مستقیماً توسط درگاه بانکی پردازش شده و نزد نوبتیک ذخیره نشود.</li>
                </ul>
              </Section>

              <Section id="payment" title="۶. پرداخت و استرداد">
                <h3>پرداخت</h3>
                <ul>
                  <li>پرداخت‌ها از طریق درگاه بانکی معتبر انجام می‌شود.</li>
                  <li>قیمت خدمات توسط کسب‌وکار تعیین شده و پیش از رزرو نمایش داده می‌شود.</li>
                  <li>نوبتیک کارمزد خدمات را مطابق تعرفه جاری از کسب‌وکار دریافت می‌کند.</li>
                </ul>
                <h3>استرداد</h3>
                <ul>
                  <li>لغو توسط مشتری تا ۲ ساعت قبل از نوبت: استرداد کامل وجه.</li>
                  <li>لغو کمتر از ۲ ساعت مانده به نوبت: بر اساس سیاست هر کسب‌وکار.</li>
                  <li>لغو توسط کسب‌وکار: استرداد کامل وجه به مشتری در کمتر از ۷۲ ساعت.</li>
                  <li>در صورت بروز مشکل، تیم پشتیبانی نوبتیک میانجیگری می‌کند.</li>
                </ul>
              </Section>

              <Section id="liability" title="۷. محدودیت مسئولیت">
                <p>نوبتیک یک پلتفرم واسط است و مسئولیت مستقیمی در قبال کیفیت خدمات کسب‌وکارها ندارد.</p>
                <p>نوبتیک مسئول موارد زیر نیست:</p>
                <ul>
                  <li>عدم حضور یا تأخیر کسب‌وکار در ارائه خدمت</li>
                  <li>کیفیت یا نتیجه خدمات ارائه‌شده</li>
                  <li>خسارات ناشی از قطع یا اختلال اینترنت</li>
                  <li>اطلاعات نادرستی که کسب‌وکار در پروفایل خود وارد کرده</li>
                </ul>
                <p>حداکثر مسئولیت نوبتیک در هر صورت از مبلغ پرداخت‌شده توسط مشتری تجاوز نخواهد کرد.</p>
              </Section>

              <Section id="changes" title="۸. تغییرات در قوانین">
                <p>
                  نوبتیک حق دارد این قوانین را در هر زمان بروزرسانی کند.
                  تغییرات مهم از طریق پیامک یا ایمیل به کاربران اطلاع‌رسانی می‌شود.
                </p>
                <p>
                  ادامه استفاده از پلتفرم پس از اعمال تغییرات به منزله پذیرش قوانین جدید است.
                  تاریخ آخرین بروزرسانی همواره در بالای این صفحه نمایش داده می‌شود.
                </p>
                <p>
                  برای سوال یا اعتراض به هر بخش از این قوانین،
                  از طریق <a href="/contact" style={{ color: '#06B6D4', fontWeight: 600 }}>صفحه تماس با ما</a> با تیم حقوقی نوبتیک ارتباط برقرار کنید.
                </p>
              </Section>

              {/* Back to top */}
              <div style={{ textAlign: 'center', paddingTop: 8 }}>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#ECFEFF', color: '#0891B2',
                    border: '1px solid #B2E8F0', borderRadius: 12,
                    padding: '10px 24px', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#CFFAFE' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ECFEFF' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                       style={{ width: 15, height: 15 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                  بازگشت به بالا
                </button>
              </div>

            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  )
}

function Section({ id, title, children }) {
  return (
    <section
      id={id}
      style={{
        background: '#fff', borderRadius: 16,
        border: '1px solid #E2F8FB', padding: '28px 28px',
        boxShadow: '0 1px 4px rgba(0,0,0,.04)',
        scrollMarginTop: 90,
      }}
    >
      <h2 style={{
        fontSize: 17, fontWeight: 800, color: '#0F172A',
        marginBottom: 18, paddingBottom: 14,
        borderBottom: '2px solid #ECFEFF',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{
          width: 4, height: 20, background: '#06B6D4',
          borderRadius: 4, display: 'inline-block', flexShrink: 0,
        }} />
        {title}
      </h2>
      <div style={{ fontSize: 14, color: '#334155', lineHeight: 2 }}
           className="terms-content">
        {children}
      </div>
      <style>{`
        .terms-content p { margin: 0 0 12px }
        .terms-content p:last-child { margin-bottom: 0 }
        .terms-content ul { padding-right: 20px; margin: 8px 0 12px }
        .terms-content ul li { margin-bottom: 6px }
        .terms-content dl { margin: 12px 0 }
        .terms-content h3 { font-size: 14px; font-weight: 700; color: #0F172A; margin: 16px 0 8px }
        .terms-content strong { color: #0F172A }
      `}</style>
    </section>
  )
}

function Term({ t, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <dt style={{ fontWeight: 700, color: '#0F172A', display: 'inline' }}>{t}: </dt>
      <dd style={{ display: 'inline', color: '#475569' }}>{children}</dd>
    </div>
  )
}
