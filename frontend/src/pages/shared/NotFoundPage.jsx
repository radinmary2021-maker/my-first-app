import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" dir="rtl">
      <div className="text-center space-y-2">
        <h1 className="text-7xl font-extrabold text-cyan-200 tracking-tight select-none">۴۰۴</h1>
        <h1 className="text-xl font-bold text-gray-700">صفحه مورد نظر یافت نشد</h1>
        <p className="text-sm text-gray-400">ممکن است آدرس اشتباه باشد یا صفحه حذف شده باشد.</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="border border-gray-200 text-gray-600 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
        >
          برگشت
        </button>
        <button
          onClick={() => navigate('/')}
          className="bg-cyan-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-cyan-600 transition-colors shadow-sm shadow-cyan-100/50"
        >
          صفحه اصلی
        </button>
      </div>
    </div>
  )
}
