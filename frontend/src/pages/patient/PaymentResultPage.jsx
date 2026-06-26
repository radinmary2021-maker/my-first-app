import { useSearchParams, useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'

export default function PaymentResultPage() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()

  const status       = params.get('status')
  const trackingCode = params.get('tracking_code')
  const refId        = params.get('ref_id')

  const isSuccess = status === 'success'
  const isFailure = status === 'failure' || status === 'failed'
  const isUnknown = !isSuccess && !isFailure

  return (
    <MainLayout>
      <style>{`
        @keyframes pop { 0% { transform: scale(0); } 70% { transform: scale(1.1); } 100% { transform: scale(1); } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
      `}</style>

      <div className="max-w-md mx-auto px-4 py-8 grid-bg">
        <div className="rounded-3xl p-8 text-center"
             style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>

          {/* -- Success -- */}
          {isSuccess && (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                   style={{ background: 'rgba(57,255,20,0.15)', animation: 'pop 0.5s ease', boxShadow: '0 0 32px rgba(57,255,20,0.2)' }}>
                <svg className="w-10 h-10" style={{ color: '#39FF14' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-xl font-black mb-2"
                  style={{ background: 'linear-gradient(135deg,#00D4C8,#00A8FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                پرداخت موفق
              </h1>
              <p className="text-sm leading-7 mb-6" style={{ color: '#4A6E8A' }}>
                نوبت شما با موفقیت ثبت شد. کد رهگیری و یادآوری از طریق پیامک برایتان ارسال می‌شود.
              </p>

              <div className="rounded-2xl p-4 mb-6 text-right space-y-2.5"
                   style={{ background: '#111E2E', border: '1px solid rgba(0,212,200,0.07)' }}>
                {trackingCode && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#4A6E8A' }}>کد پیگیری</span>
                    <span className="font-bold" dir="ltr" style={{ color: '#DCF0F5' }}>{trackingCode}</span>
                  </div>
                )}
                {refId && (
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#4A6E8A' }}>شماره مرجع</span>
                    <span className="font-bold" dir="ltr" style={{ color: '#DCF0F5' }}>{refId}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/my-appointments')}
                className="w-full text-white font-black py-3.5 rounded-2xl text-sm hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
              >
                مشاهده نوبت‌های من
              </button>
            </>
          )}

          {/* -- Failure -- */}
          {isFailure && (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                   style={{ background: 'rgba(239,68,68,0.1)', animation: 'shake 0.5s ease', boxShadow: '0 0 32px rgba(239,68,68,0.15)' }}>
                <svg className="w-10 h-10" style={{ color: '#EF4444' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="text-xl font-black mb-2" style={{ color: '#DCF0F5' }}>پرداخت ناموفق</h1>
              <p className="text-sm leading-7 mb-6" style={{ color: '#4A6E8A' }}>
                متأسفانه پرداخت شما تکمیل نشد. نگران نباشید، مبلغی از حساب شما کسر نشده است.
              </p>

              <div className="rounded-2xl p-4 mb-6 text-right"
                   style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#EF4444' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-xs leading-6" style={{ color: '#EF4444' }}>
                    در صورت کسر وجه از حساب، مبلغ طی ۷۲ ساعت کاری بازگشت داده می‌شود.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="w-full text-white font-black py-3.5 rounded-2xl text-sm hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
                >
                  تلاش مجدد برای پرداخت
                </button>
                <button
                  onClick={() => navigate('/providers')}
                  className="w-full font-bold py-3.5 rounded-2xl text-sm transition-colors"
                  style={{ border: '1px solid rgba(0,212,200,0.3)', color: '#00D4C8', background: 'transparent' }}
                >
                  بازگشت به کسب‌وکارها
                </button>
              </div>
            </>
          )}

          {/* -- Unknown -- */}
          {isUnknown && (
            <>
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                   style={{ background: 'rgba(74,110,138,0.15)' }}>
                <svg className="w-10 h-10" style={{ color: '#4A6E8A' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h1 className="text-xl font-black mb-2" style={{ color: '#DCF0F5' }}>نتیجه نامشخص</h1>
              <p className="text-sm leading-7 mb-6" style={{ color: '#4A6E8A' }}>
                وضعیت پرداخت شما مشخص نیست. لطفاً نوبت‌های خود را بررسی کنید.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/my-appointments')}
                  className="w-full text-white font-black py-3.5 rounded-2xl text-sm hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
                >
                  مشاهده نوبت‌های من
                </button>
                <button
                  onClick={() => navigate('/providers')}
                  className="w-full font-bold py-3.5 rounded-2xl text-sm transition-colors"
                  style={{ border: '1px solid rgba(0,212,200,0.3)', color: '#00D4C8', background: 'transparent' }}
                >
                  رزرو نوبت جدید
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </MainLayout>
  )
}
