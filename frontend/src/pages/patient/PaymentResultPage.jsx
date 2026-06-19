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

      <div className="max-w-md mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">

          {/* ── Success ── */}
          {isSuccess && (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5"
                   style={{ animation: 'pop 0.5s ease' }}>
                <svg className="w-10 h-10 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-2">پرداخت موفق</h1>
              <p className="text-sm text-slate-500 leading-7 mb-6">
                نوبت شما با موفقیت ثبت شد. کد رهگیری و یادآوری از طریق پیامک برایتان ارسال می‌شود.
              </p>

              <div className="bg-slate-50 rounded-2xl p-4 mb-6 text-right space-y-2.5">
                {trackingCode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">کد پیگیری</span>
                    <span className="font-bold text-slate-700" dir="ltr">{trackingCode}</span>
                  </div>
                )}
                {refId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">شماره مرجع</span>
                    <span className="font-bold text-slate-700" dir="ltr">{refId}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/my-appointments')}
                className="w-full text-white font-black py-3.5 rounded-2xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-cyan-200"
                style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
              >
                مشاهده نوبت‌های من
              </button>
            </>
          )}

          {/* ── Failure ── */}
          {isFailure && (
            <>
              <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-5"
                   style={{ animation: 'shake 0.5s ease' }}>
                <svg className="w-10 h-10 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-2">پرداخت ناموفق</h1>
              <p className="text-sm text-slate-500 leading-7 mb-6">
                متأسفانه پرداخت شما تکمیل نشد. نگران نباشید، مبلغی از حساب شما کسر نشده است.
              </p>

              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 text-right">
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-xs text-rose-700 leading-6">
                    در صورت کسر وجه از حساب، مبلغ طی ۷۲ ساعت کاری بازگشت داده می‌شود.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="w-full text-white font-black py-3.5 rounded-2xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-cyan-200"
                  style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
                >
                  تلاش مجدد برای پرداخت
                </button>
                <button
                  onClick={() => navigate('/providers')}
                  className="w-full bg-slate-50 text-slate-600 font-bold py-3.5 rounded-2xl text-sm hover:bg-slate-100 transition-colors"
                >
                  بازگشت به کسب‌وکارها
                </button>
              </div>
            </>
          )}

          {/* ── Unknown ── */}
          {isUnknown && (
            <>
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-2">نتیجه نامشخص</h1>
              <p className="text-sm text-slate-500 leading-7 mb-6">
                وضعیت پرداخت شما مشخص نیست. لطفاً نوبت‌های خود را بررسی کنید.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/my-appointments')}
                  className="w-full text-white font-black py-3.5 rounded-2xl text-sm hover:opacity-90 transition-opacity shadow-lg shadow-cyan-200"
                  style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
                >
                  مشاهده نوبت‌های من
                </button>
                <button
                  onClick={() => navigate('/providers')}
                  className="w-full bg-slate-50 text-slate-600 font-bold py-3.5 rounded-2xl text-sm hover:bg-slate-100 transition-colors"
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
