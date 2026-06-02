import { useSearchParams, useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'

export default function PaymentResultPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const status = params.get('status')
  const trackingCode = params.get('tracking_code')
  const refId = params.get('ref_id')
  const isSuccess = status === 'success'

  return (
    <MainLayout>
      <div className="max-w-sm mx-auto space-y-6 text-center">
        {isSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">
              ✓
            </div>
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
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-4xl">
              ✕
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-800">پرداخت ناموفق</h1>
              <p className="text-sm text-gray-500">پرداخت انجام نشد یا لغو شد</p>
            </div>
          </>
        )}

        <button
          onClick={() => navigate('/doctors')}
          className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          رزرو نوبت جدید
        </button>
      </div>
    </MainLayout>
  )
}
