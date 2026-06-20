import { useState, useEffect } from 'react'
import MainLayout from '../../layouts/MainLayout'
import SEOHead from '../../components/SEOHead'

const SECTIONS = [
  { id: 't1', n: '۱', title: 'تعاریف', color: 'bg-cyan-500',
    text: 'در این قوانین، «نوبتیک» به پلتفرم رزرو آنلاین نوبت اشاره دارد. «کاربر» شامل مشتریان و صاحبان کسب‌وکار است. «خدمت» هر سرویسی است که کسب‌وکار از طریق پلتفرم ارائه می‌دهد. «نوبت» زمان رزروشده توسط مشتری برای دریافت خدمت است.' },
  { id: 't2', n: '۲', title: 'شرایط استفاده', color: 'bg-purple-500',
    text: 'استفاده از نوبتیک به معنای پذیرش کامل این قوانین است. کاربران موظف به ارائه اطلاعات صحیح هستند. حداقل سن استفاده ۱۸ سال است. استفاده از ربات یا اسکریپت برای رزرو انبوه ممنوع است.' },
  { id: 't3', n: '۳', title: 'حقوق و تکالیف کاربران', color: 'bg-emerald-500',
    text: 'کاربران حق دارند نوبت خود را تا قبل از زمان مقرر لغو کنند. کاربران باید در زمان تعیین‌شده حاضر شوند. حق دسترسی به تاریخچه نوبت‌ها و درخواست حذف حساب محفوظ است.' },
  { id: 't4', n: '۴', title: 'حقوق و تکالیف کسب‌وکارها', color: 'bg-orange-500',
    text: 'کسب‌وکارها موظف به ارائه خدمات مطابق توضیحات ثبت‌شده و رعایت ساعات کاری اعلام‌شده هستند. حق تعیین قیمت و مدیریت نوبت‌ها به صورت مستقل محفوظ است.' },
  { id: 't5', n: '۵', title: 'حریم خصوصی', color: 'bg-rose-500',
    text: 'اطلاعات شخصی کاربران با بالاترین استانداردهای امنیتی محافظت شده و صرفاً برای ارائه خدمات استفاده می‌شود. اطلاعات پرداخت مستقیماً توسط درگاه بانکی پردازش شده و نزد نوبتیک ذخیره نمی‌شود.' },
  { id: 't6', n: '۶', title: 'پرداخت و استرداد', color: 'bg-cyan-500',
    text: 'پرداخت‌ها از طریق درگاه امن زرین‌پال انجام می‌شود. استرداد وجه طبق سیاست لغو هر کسب‌وکار صورت می‌گیرد. لغو توسط کسب‌وکار منجر به بازگشت کامل وجه می‌شود.' },
  { id: 't7', n: '۷', title: 'محدودیت مسئولیت', color: 'bg-purple-500',
    text: 'نوبتیک صرفاً نقش واسط بین کاربر و کسب‌وکار را دارد و مسئولیت کیفیت خدمات بر عهده کسب‌وکار است. حداکثر مسئولیت نوبتیک از مبلغ پرداختی تجاوز نخواهد کرد.' },
  { id: 't8', n: '۸', title: 'تغییرات در قوانین', color: 'bg-emerald-500',
    text: 'نوبتیک حق دارد این قوانین را به‌روزرسانی کند. تغییرات از طریق همین صفحه اطلاع‌رسانی می‌شود. ادامه استفاده پس از تغییرات به منزله پذیرش قوانین جدید است.' },
]

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('t1')

  useEffect(() => {
    function onScroll() {
      for (const s of [...SECTIONS].reverse()) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= 100) {
          setActiveSection(s.id)
          return
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id) {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <MainLayout fullWidth>
      <SEOHead
        title="قوانین و مقررات"
        description="قوانین و مقررات استفاده از پلتفرم نوبتیک — شرایط استفاده، حریم خصوصی، پرداخت و استرداد."
        canonical="/terms"
      />

      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="text-center pt-8 pb-10">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">قوانین و مقررات</h1>
          <p className="text-slate-400 text-sm">آخرین بروزرسانی: ۱ تیر ۱۴۰۴</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* TOC */}
          <aside className="w-full lg:w-56 shrink-0 bg-white rounded-2xl border border-slate-100 p-3 lg:sticky lg:top-24">
            <h3 className="text-xs font-bold text-slate-400 px-3 py-2">فهرست مطالب</h3>
            <nav className="space-y-0.5">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={`block w-full text-right px-3 py-2 rounded-lg text-xs transition-all ${
                    activeSection === s.id
                      ? 'bg-cyan-50 text-cyan-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.n}. {s.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 w-full bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 space-y-8">
            {SECTIONS.map((s) => (
              <section key={s.id} id={s.id} style={{ scrollMarginTop: 90 }}>
                <h2 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                  <span className={`w-1.5 h-5 ${s.color} rounded-full`} />
                  {s.n}. {s.title}
                </h2>
                <p className="text-xs text-slate-500 leading-7">{s.text}</p>
              </section>
            ))}

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 text-xs font-bold text-cyan-600 bg-cyan-50 px-4 py-2.5 rounded-xl w-fit hover:bg-cyan-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m18 15-6-6-6 6" /></svg>
              بازگشت به بالا
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
