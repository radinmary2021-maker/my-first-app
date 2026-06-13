import { useSearchParams, useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Button from '../../components/Button'
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '../../components/Icon'

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
      <div className="max-w-sm mx-auto space-y-6 text-center">
        {isSuccess && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircleIcon size={40} />
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

            <div className="flex flex-col gap-3">
              <Button variant="primary" fullWidth onClick={() => navigate('/my-appointments')}>
                مشاهده نوبت‌های من
              </Button>
              <Button variant="ghost" fullWidth onClick={() => navigate('/providers')}>
                رزرو نوبت جدید
              </Button>
            </div>
          </>
        )}

        {isFailure && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-500">
              <XCircleIcon size={40} />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-800">پرداخت ناموفق</h1>
              <p className="text-sm text-gray-500">پرداخت انجام نشد یا لغو شد</p>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-700 text-right">
              در صورت کسر وجه از حساب، مبلغ طی ۷۲ ساعت کاری به حساب شما بازگشت داده می‌شود.
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="primary" fullWidth onClick={() => navigate('/providers')}>
                رزرو نوبت جدید
              </Button>
              <Button variant="ghost" fullWidth onClick={() => navigate(-1)}>
                تلاش مجدد
              </Button>
            </div>
          </>
        )}

        {isUnknown && (
          <>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <ClockIcon size={40} />
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-gray-800">نتیجه نامشخص</h1>
              <p className="text-sm text-gray-500">وضعیت پرداخت شما مشخص نیست</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700 text-right">
              لطفاً نوبت‌های خود را بررسی کنید. در صورت کسر وجه، مبلغ طی ۷۲ ساعت کاری بازگشت داده می‌شود.
            </div>

            <div className="flex flex-col gap-3">
              <Button variant="primary" fullWidth onClick={() => navigate('/my-appointments')}>
                مشاهده نوبت‌های من
              </Button>
              <Button variant="ghost" fullWidth onClick={() => navigate('/providers')}>
                رزرو نوبت جدید
              </Button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
