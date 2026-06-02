import { useNavigate } from 'react-router-dom'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" dir="rtl">
      <h1 className="text-4xl font-bold text-gray-400">۴۰۴</h1>
      <p className="text-gray-500">صفحه مورد نظر یافت نشد</p>
      <button
        onClick={() => navigate('/')}
        className="text-blue-600 hover:underline text-sm"
      >
        بازگشت به صفحه اصلی
      </button>
    </div>
  )
}
