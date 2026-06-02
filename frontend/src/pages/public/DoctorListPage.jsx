import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'

// Sprint Frontend 2 پیاده‌سازی می‌شود
export default function DoctorListPage() {
  return (
    <MainLayout>
      <div className="text-center py-20 text-gray-400">
        <Spinner className="mb-4" />
        <p className="text-sm">لیست پزشکان — Sprint 2</p>
      </div>
    </MainLayout>
  )
}
