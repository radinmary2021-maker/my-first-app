import { useNavigate } from 'react-router-dom'
import Button from '../../components/Button'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" dir="rtl">
      <div className="text-center space-y-2">
        <h1
          className="text-7xl font-extrabold tracking-tight select-none"
          style={{ color: 'var(--color-border-strong)' }}
        >
          ۴۰۴
        </h1>
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          صفحه مورد نظر یافت نشد
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          ممکن است آدرس اشتباه باشد یا صفحه حذف شده باشد.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" size="md" onClick={() => navigate(-1)}>برگشت</Button>
        <Button variant="primary" size="md" onClick={() => navigate('/')}>صفحه اصلی</Button>
      </div>
    </div>
  )
}
