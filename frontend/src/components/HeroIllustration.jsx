import { useEffect, useState } from 'react'

const CSS = `
@keyframes hi-float {
  0%,100%{ transform:translateY(0px) }
  50%    { transform:translateY(-10px) }
}
@keyframes hi-float2 {
  0%,100%{ transform:translateY(0px) }
  50%    { transform:translateY(-14px) }
}
@keyframes hi-hb {
  0%,100%{ transform:scale(1) }
  14%    { transform:scale(1.35) }
  28%    { transform:scale(1) }
  42%    { transform:scale(1.2) }
}
@keyframes hi-fadeup {
  from{ opacity:0; transform:translateY(20px) }
  to  { opacity:1; transform:translateY(0) }
}
@keyframes hi-pulse-ring {
  0%   { transform:scale(1);   opacity:.6 }
  100% { transform:scale(1.8); opacity:0  }
}
.hi-f1{ animation: hi-float  4s   ease-in-out infinite }
.hi-f2{ animation: hi-float2 5.5s ease-in-out infinite 1s }
.hi-f3{ animation: hi-float  3.5s ease-in-out infinite 2s }
.hi-hb{ animation: hi-hb     1.8s ease-in-out infinite }
.hi-up{ animation: hi-fadeup .8s  ease-out both }
.hi-pr{ animation: hi-pulse-ring 1.4s ease-out infinite }
`

const DAYS = ['ش','ی','د','س','چ','پ','ج']
const DATES = Array.from({ length: 30 }, (_, i) => i + 1)
const TODAY = 15
const SELECTED = 16

export default function HeroIllustration() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { setTimeout(() => setLoaded(true), 60) }, [])

  return (
    <div className={`relative w-full h-full transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-8 right-8 w-72 h-72 bg-cyan-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-12 left-8 w-56 h-56 bg-violet-100 rounded-full blur-2xl opacity-40" />
      </div>

      {/* ── Main: Booking Calendar Card ── */}
      <div className="hi-f1 relative mx-auto w-72 h-96 sm:w-80 sm:h-[26rem]"
           style={{ filter: 'drop-shadow(0 20px 40px rgba(6,182,212,.22))' }}>

        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-cyan-400 to-violet-400 opacity-20 blur-sm" />
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-cyan-200 to-violet-200 opacity-40" />

        {/* Calendar card */}
        <div className="relative w-full h-full rounded-3xl ring-4 ring-white shadow-2xl bg-white p-5 overflow-hidden" dir="rtl">

          {/* Business header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 flex items-center justify-center shrink-0 shadow-sm text-lg">
              ✂️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">آرایشگاه بانو</p>
              <p className="text-xs text-gray-400">آرایش و زیبایی</p>
            </div>
            <span className="shrink-0 text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2 py-0.5 font-semibold">
              فعال
            </span>
          </div>

          {/* Month header */}
          <div className="flex justify-between items-center mb-2">
            <button className="text-gray-400 text-sm px-1">←</button>
            <span className="text-xs font-bold text-gray-700">خرداد ۱۴۰۴</span>
            <button className="text-gray-400 text-sm px-1">→</button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-0.5 mb-1 text-center">
            {DAYS.map((d) => (
              <span key={d} className="text-[9px] text-gray-400 font-semibold">{d}</span>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {DATES.map((d) => (
              <div
                key={d}
                className={`text-center text-[10px] py-1 rounded-md font-medium transition-colors
                  ${d === TODAY
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : d === SELECTED
                    ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200'
                    : d > 16 && d < 20
                    ? 'text-gray-300'
                    : 'text-gray-500 hover:bg-gray-50'
                  }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="mt-3 border-t border-gray-50 pt-3">
            <p className="text-[10px] text-gray-400 mb-2">زمان‌های خرداد {SELECTED}</p>
            <div className="flex gap-1.5 flex-wrap">
              {[['۹:۰۰', false], ['۱۱:۳۰', true], ['۱۴:۰۰', false]].map(([t, active]) => (
                <span
                  key={t}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                    active ? 'bg-cyan-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Subtle bottom gradient */}
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
        </div>

        {/* Calendar badge */}
        <div className="absolute -top-3 -left-3 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-lg">
          📅
        </div>
      </div>

      {/* ── Floating: Appointment confirmation ── */}
      <div className="hi-f2 hi-up absolute top-2 -left-4 bg-white rounded-2xl shadow-xl
                      border border-gray-100 px-3.5 py-3 w-52 z-20"
           dir="rtl" style={{ animationDelay: '.3s' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-base shrink-0">✅</div>
          <div>
            <p className="text-xs font-bold text-gray-800 leading-tight">نوبت تأیید شد</p>
            <p className="text-xs text-gray-400">شنبه ۱۶ خرداد — ۱۱:۳۰</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block shrink-0" />
          <span className="text-xs text-green-600 font-medium">تأیید شده</span>
          <span className="text-xs text-gray-300 mr-auto">کد: APT-3K7X</span>
        </div>
      </div>

      {/* ── Floating: Satisfaction badge ── */}
      <div className="hi-f3 hi-up absolute bottom-14 -right-4 bg-white rounded-2xl shadow-xl
                      border border-gray-100 px-3.5 py-3 z-20"
           dir="rtl" style={{ animationDelay: '.5s' }}>
        <div className="flex items-center gap-2.5">
          <div className="hi-hb text-2xl">⭐</div>
          <div>
            <p className="text-xs font-bold text-gray-800">+۱۰٬۰۰۰ مشتری راضی</p>
            <div className="flex gap-0.5 mt-0.5">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-amber-400 text-xs">★</span>
              ))}
              <span className="text-xs text-gray-400 mr-1">۴.۹</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating: Active businesses ── */}
      <div className="hi-up absolute top-1/2 -translate-y-1/2 -right-2 bg-white rounded-2xl shadow-lg
                      border border-gray-100 px-3 py-2 z-20 flex items-center gap-2"
           dir="rtl" style={{ animationDelay: '.7s' }}>
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="hi-pr absolute inline-flex h-full w-full rounded-full bg-green-400" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
        </span>
        <span className="text-xs font-medium text-gray-700 whitespace-nowrap">۱۲ کسب‌وکار آنلاین</span>
      </div>
    </div>
  )
}
