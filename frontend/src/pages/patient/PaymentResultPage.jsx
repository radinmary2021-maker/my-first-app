import { useSearchParams, useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'

function CheckIcon() {
  return (
    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
      <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24"
           stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

function XIcon() {
  return (
    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
      <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24"
           stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  )
}

export default function PaymentResultPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const status       = params.get('status')
  const trackingCode = params.get('tracking_code')
  const refId        = params.get('ref_id')
  const isSuccess    = status === 'success'

  return (
    <MainLayout>
      <div className="max-w-sm mx-auto space-y-6 text-center">
        {isSuccess ? (
          <>
            <CheckIcon />
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-800">پرداخت موفق</h1>
              <p className="text-sm text-gray-500">نوبت شما با موفقیت ثبت شد</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3 text-sm text-right">
              {trackingCode && (
                <div className="flex justify-between">
                  <span className="text-gray-500">کد پیگیری</span>
                  <span className="font-mono font-bold text-gray-800">{trackingCode}</span>
                </div>
              )}
              {refId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">شماره مرجع</span>
                  <span className="font-mono text-gray-700" dir="ltr">{refId}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-400">
              اطلاعات نوبت از طریق پیامک ارسال شده است
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/my-appointments')}
                className="w-full bg-cyan-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-cyan-600 transition-colors"
              >
                مشاهده نوبت‌های من
              </button>
              <button
                onClick={() => navigate('/providers')}
                className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                رزرو نوبت جدید
              </button>
            </div>
          </>
        ) : (
          <>
            <XIcon />
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-800">پرداخت ناموفق</h1>
              <p className="text-sm text-gray-500">پرداخت انجام نشد یا لغو شد</p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700 text-right">
              در صورت کسر وجه از حساب، مبلغ طی ۷۲ ساعت کاری به حساب شما بازگشت داده می‌شود.
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate('/providers')}
                className="w-full bg-cyan-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-cyan-600 transition-colors"
              >
                رزرو نوبت جدید
              </button>
              <button
                onClick={() => navigate(-1)}
                className="w-full border border-gray-200 text-gray-600 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                تلاش مجدد
              </button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
