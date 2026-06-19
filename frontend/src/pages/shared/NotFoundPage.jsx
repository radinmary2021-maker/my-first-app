import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 pb-16" dir="rtl">
      <div className="text-center">
        <div className="relative w-48 h-48 mx-auto mb-6" style={{ animation: 'float 3s ease-in-out infinite' }}>
          <div className="absolute inset-0 rounded-full opacity-10"
               style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.5 9.5c0-1 1-2 2.5-2s2.5 1 2.5 2c0 1-1 1.5-2 2.5-.5.5-.5 1-.5 1.5" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </svg>
          </div>
        </div>
        <h1 className="text-5xl font-black mb-3"
            style={{ background: 'linear-gradient(135deg,#0891B2,#06B6D4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ۴۰۴
        </h1>
        <h2 className="text-lg font-black text-slate-800 mb-2">صفحه پیدا نشد!</h2>
        <p className="text-sm text-slate-400 leading-7 mb-8 max-w-sm mx-auto">
          به نظر می‌رسد صفحه‌ای که دنبالش هستید جابه‌جا شده یا اصلاً وجود ندارد.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-cyan-200 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            بازگشت به خانه
          </button>
          <button
            onClick={() => navigate('/providers')}
            className="bg-white border border-slate-200 text-slate-600 font-bold px-6 py-3 rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            جستجوی کسب‌وکار
          </button>
        </div>
      </div>
      <style>{`@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }`}</style>
    </div>
  )
}
