import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import DoctorCard from '../../components/DoctorCard'
import { useDoctors } from '../../hooks/useDoctors'

export default function DoctorListPage() {
  const { data: doctors, isLoading, isError, error } = useDoctors()

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">پزشکان</h1>
        <p className="text-sm text-gray-500 mt-1">پزشک مورد نظر خود را انتخاب کنید</p>
      </div>

      {isLoading && <Spinner className="py-20" />}

      {isError && (
        <ErrorMessage
          message={error?.response?.data?.error || 'خطا در دریافت لیست پزشکان'}
        />
      )}

      {doctors && doctors.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p>هیچ پزشکی یافت نشد</p>
        </div>
      )}

      {doctors && doctors.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>
      )}
    </MainLayout>
  )
}
