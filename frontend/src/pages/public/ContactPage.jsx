import { useState } from 'react'
import MainLayout from '../../layouts/MainLayout'
import SEOHead from '../../components/SEOHead'
import Spinner from '../../components/Spinner'

const FAQS = [
  { q: 'چطور نوبت بگیرم؟', a: 'کافیست کسب‌وکار موردنظر را جستجو کنید و روی «رزرو نوبت» کلیک کنید.' },
  { q: 'آیا پرداخت امن است؟', a: 'بله، تمامی پرداخت‌ها از طریق درگاه امن زرین‌پال انجام می‌شود.' },
  { q: 'چطور نوبت را لغو کنم؟', a: 'از بخش «نوبت‌های من» می‌توانید نوبت خود را لغو کنید.' },
  { q: 'چطور کسب‌وکارم را ثبت کنم؟', a: 'روی دکمه «ثبت کسب‌وکار» کلیک کنید و فرم را تکمیل نمایید.' },
]

const SUBJECTS = ['پشتیبانی فنی', 'ثبت کسب‌وکار', 'سوال درباره پرداخت', 'گزارش مشکل', 'پیشنهاد و انتقاد', 'سایر']

const inputCls = "w-full border-2 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 transition-colors"
const inputStyle = { borderColor: '#E0F7FA', background: '#F0FDFF' }

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <MainLayout fullWidth>
      <SEOHead
        title="تماس با ما"
        description="با تیم پشتیبانی نوبتیک تماس بگیرید — ایمیل، تلفن، یا فرم آنلاین."
        canonical="/contact"
      />

      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="text-center pt-8 pb-10">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">تماس با ما</h1>
          <p className="text-slate-400">سوالی دارید؟ خوشحال می‌شویم کمکتان کنیم</p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <a href="mailto:support@nobatiic.ir" className="bg-white rounded-2xl border border-slate-100 p-5 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600 to-cyan-400 flex items-center justify-center mx-auto mb-3 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">ایمیل</h3>
            <span className="text-xs text-cyan-600 font-semibold" dir="ltr">support@nobatiic.ir</span>
          </a>
          <a href="tel:02144000000" className="bg-white rounded-2xl border border-slate-100 p-5 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center mx-auto mb-3 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.63 19a20.49 20.49 0 0 1-4.83-4.72 19.79 19.79 0 0 1-3.06-8.53A2 2 0 0 1 5.11 4h3a2 2 0 0 1 2 1.72 12 12 0 0 0 .66 2.65 2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 6.29 6.29l1.19-1.19a2 2 0 0 1 2.11-.45 12 12 0 0 0 2.65.66A2 2 0 0 1 22 16.92z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">تلفن</h3>
            <span className="text-xs text-emerald-600 font-semibold" dir="ltr">021-44000000</span>
          </a>
          <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-pink-400 flex items-center justify-center mx-auto mb-3 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" /><circle cx="12" cy="9" r="2.5" /></svg>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">آدرس</h3>
            <p className="text-xs text-slate-500">تهران، ایران</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Form */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-bold text-slate-800 mb-5">فرم تماس</h2>

            {submitted ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
                  <svg className="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" strokeLinecap="round" /></svg>
                </div>
                <p className="text-sm font-bold text-slate-800">پیام شما ارسال شد!</p>
                <p className="text-xs text-slate-400">در اولین فرصت با شما تماس خواهیم گرفت.</p>
                <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                        className="text-xs font-bold text-cyan-600 bg-cyan-50 px-4 py-2 rounded-lg hover:bg-cyan-100 transition-colors">
                  ارسال پیام جدید
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block">نام</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required
                         placeholder="نام شما" className={inputCls} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block">ایمیل</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required
                         placeholder="email@example.com" dir="ltr" className={`${inputCls} text-left`} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block">موضوع</label>
                  <select name="subject" value={form.subject} onChange={handleChange} required className={inputCls} style={inputStyle}>
                    <option value="" disabled>یک موضوع انتخاب کنید</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-2 block">پیام</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required rows={4}
                            placeholder="پیام خود را بنویسید..." className={`${inputCls} resize-none`} style={inputStyle} />
                </div>
                <button type="submit"
                        className="w-full text-white font-black py-3.5 rounded-xl text-sm shadow-lg shadow-cyan-200 hover:opacity-90 transition-opacity"
                        style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}>
                  ارسال پیام
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-5">سوالات متداول</h2>
            <div className="space-y-2">
              {FAQS.map((faq, i) => (
                <details key={i} className="bg-white rounded-xl border border-slate-100 overflow-hidden group">
                  <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
                    <span className="text-sm font-semibold text-slate-700">{faq.q}</span>
                    <svg className="w-4 h-4 text-cyan-500 transition-transform duration-200 group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                  </summary>
                  <p className="px-4 pb-4 text-xs text-slate-400 leading-6">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
