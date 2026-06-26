import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-4 pb-16" dir="rtl"
         style={{ background: '#070D14' }}>
      <div className="text-center">
        <div className="relative w-48 h-48 mx-auto mb-6" style={{ animation: 'float 3s ease-in-out infinite' }}>
          <div className="absolute inset-0 rounded-full"
               style={{ background: 'rgba(0,212,200,0.1)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-24 h-24" style={{ color: 'rgba(0,212,200,0.4)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.5 9.5c0-1 1-2 2.5-2s2.5 1 2.5 2c0 1-1 1.5-2 2.5-.5.5-.5 1-.5 1.5" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </svg>
          </div>
        </div>
        <h1 className="font-black mb-3"
            style={{
              fontSize: 'clamp(3rem,8vw,6rem)',
              background: 'linear-gradient(135deg,#00D4C8,#00A8FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
          ۴۰۴
        </h1>
        <h2 className="text-lg font-black mb-2" style={{ color: '#DCF0F5' }}>صفحه پیدا نشد!</h2>
        <p className="text-sm leading-7 mb-8 max-w-sm mx-auto" style={{ color: '#4A6E8A' }}>
          به نظر می‌رسد صفحه‌ای که دنبالش هستید جابه‌جا شده یا اصلاً وجود ندارد.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="text-white font-bold px-6 py-3 rounded-2xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            بازگشت به خانه
          </button>
          <button
            onClick={() => navigate('/providers')}
            className="font-bold px-6 py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-colors"
            style={{ border: '1px solid rgba(0,212,200,0.3)', color: '#00D4C8', background: 'transparent' }}
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
