import { useState, useMemo } from 'react'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import DoctorCard from '../../components/DoctorCard'
import { useDoctors } from '../../hooks/useDoctors'

const ALL = 'همه'

export default function DoctorListPage() {
  const { data: doctors, isLoading, isError, error } = useDoctors()
  const [selectedSpecialty, setSelectedSpecialty] = useState(ALL)

  // Derive sorted unique specialty list — stable reference while doctors is unchanged
  const specialties = useMemo(() => {
    if (!doctors?.length) return []
    const unique = [...new Set(doctors.map((d) => d.specialty))].sort((a, b) =>
      a.localeCompare(b, 'fa')
    )
    return unique
  }, [doctors])

  // Filtered list — recomputes only when doctors or selection changes
  const filteredDoctors = useMemo(() => {
    if (!doctors) return []
    if (selectedSpecialty === ALL) return doctors
    return doctors.filter((d) => d.specialty === selectedSpecialty)
  }, [doctors, selectedSpecialty])

  // Reset filter if selected specialty disappears from a fresh fetch
  const effectiveSpecialty =
    selectedSpecialty === ALL || specialties.includes(selectedSpecialty)
      ? selectedSpecialty
      : ALL

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">پزشکان</h1>
          <p className="text-sm text-gray-500 mt-1">پزشک مورد نظر خود را انتخاب کنید</p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div>
            <SpecialtyFilterSkeleton />
            <Spinner className="py-20" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <ErrorMessage
            message={error?.response?.data?.error || 'خطا در دریافت لیست پزشکان'}
          />
        )}

        {/* Loaded */}
        {!isLoading && !isError && doctors && (
          <>
            {/* Specialty filter chips — only shown when there are 2+ specialties */}
            {specialties.length >= 2 && (
              <div
                role="group"
                aria-label="فیلتر تخصص"
                className="flex flex-wrap gap-2"
              >
                <FilterChip
                  label={ALL}
                  active={effectiveSpecialty === ALL}
                  onClick={() => setSelectedSpecialty(ALL)}
                />
                {specialties.map((s) => (
                  <FilterChip
                    key={s}
                    label={s}
                    active={effectiveSpecialty === s}
                    onClick={() => setSelectedSpecialty(s)}
                  />
                ))}
              </div>
            )}

            {/* Results */}
            <div aria-live="polite" aria-atomic="false">
              {filteredDoctors.length === 0 && doctors.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-4xl mb-3">🏥</p>
                  <p>هیچ پزشکی ثبت نشده است</p>
                </div>
              )}

              {filteredDoctors.length === 0 && doctors.length > 0 && (
                <div className="text-center py-20 text-gray-400 space-y-3">
                  <p className="text-4xl">🔍</p>
                  <p className="text-sm">
                    هیچ پزشکی با تخصص «{effectiveSpecialty}» یافت نشد
                  </p>
                  <button
                    onClick={() => setSelectedSpecialty(ALL)}
                    className="text-blue-500 text-sm hover:text-blue-700"
                  >
                    نمایش همه پزشکان
                  </button>
                </div>
              )}

              {filteredDoctors.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDoctors.map((doctor) => (
                    <DoctorCard key={doctor.id} doctor={doctor} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
  )
}

// Placeholder bar shown while doctors are loading so layout doesn't jump
function SpecialtyFilterSkeleton() {
  return (
    <div className="flex gap-2 mb-2" aria-hidden="true">
      {[80, 96, 64, 88].map((w) => (
        <div
          key={w}
          className="h-8 rounded-full bg-gray-100 animate-pulse"
          style={{ width: w }}
        />
      ))}
    </div>
  )
}
