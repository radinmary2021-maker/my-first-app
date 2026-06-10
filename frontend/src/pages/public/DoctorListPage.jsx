import { useState, useMemo } from 'react'
import MainLayout from '../../layouts/MainLayout'
import ErrorMessage from '../../components/ErrorMessage'
import DoctorCard from '../../components/DoctorCard'
import SkeletonCard from '../../components/SkeletonCard'
import { useProviders } from '../../hooks/useDoctors'

const ALL = 'همه'

export default function DoctorListPage() {
  const { data: providers, isLoading, isError, error } = useProviders()
  const [selectedCategory, setSelectedCategory] = useState(ALL)
  const [search, setSearch] = useState('')

  const categories = useMemo(() => {
    if (!providers?.length) return []
    return [...new Set(providers.map((p) => p.category_display || p.specialty).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'fa')
    )
  }, [providers])

  const filtered = useMemo(() => {
    if (!providers) return []
    return providers.filter((p) => {
      const cat = p.category_display || p.specialty || ''
      const name = p.business_name || p.full_name || ''
      const matchCategory = selectedCategory === ALL || cat === selectedCategory
      const matchSearch =
        !search.trim() ||
        name.includes(search.trim()) ||
        cat.includes(search.trim())
      return matchCategory && matchSearch
    })
  }, [providers, selectedCategory, search])

  const effectiveCategory =
    selectedCategory === ALL || categories.includes(selectedCategory)
      ? selectedCategory
      : ALL

  return (
    <MainLayout>
      <div className="space-y-6">

        {/* ── Page header ── */}
        <div className="bg-gradient-to-l from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg shadow-cyan-100/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                   strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">لیست ارائه‌دهندگان</h1>
              <p className="text-cyan-100 text-xs mt-0.5">
                {providers ? `${providers.length} ارائه‌دهنده آماده ثبت نوبت` : 'ارائه‌دهنده مورد نظر خود را پیدا کنید'}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام یا تخصص..."
              className="w-full pr-10 pl-4 py-3 bg-white rounded-xl text-sm text-gray-800
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300
                         shadow-sm transition-all"
            />
          </div>
        </div>

        {/* ── Loading skeletons ── */}
        {isLoading && (
          <>
            <div className="flex gap-2 flex-wrap">
              {[80, 96, 72, 88, 64].map((w) => (
                <div key={w} className="h-8 rounded-full bg-gray-100 animate-pulse" style={{ width: w }} />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </>
        )}

        {/* ── Error ── */}
        {isError && (
          <ErrorMessage message={error?.response?.data?.error || 'خطا در دریافت لیست ارائه‌دهندگان'} />
        )}

        {/* ── Content ── */}
        {!isLoading && !isError && providers && (
          <>
            {/* Category filter chips */}
            {categories.length >= 2 && (
              <div role="group" aria-label="فیلتر دسته‌بندی"
                   className="flex flex-wrap gap-2">
                <FilterChip
                  label={ALL}
                  active={effectiveCategory === ALL}
                  onClick={() => setSelectedCategory(ALL)}
                />
                {categories.map((c) => (
                  <FilterChip
                    key={c}
                    label={c}
                    active={effectiveCategory === c}
                    onClick={() => setSelectedCategory(c)}
                  />
                ))}
              </div>
            )}

            {/* Results */}
            <div aria-live="polite">
              {filtered.length === 0 ? (
                <div className="text-center py-24 space-y-4">
                  <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-cyan-300" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">نتیجه‌ای یافت نشد</p>
                  <button
                    onClick={() => { setSearch(''); setSelectedCategory(ALL) }}
                    className="text-cyan-600 text-sm font-semibold hover:text-cyan-800
                               bg-cyan-50 px-4 py-2 rounded-lg hover:bg-cyan-100 transition-colors"
                  >
                    پاک کردن فیلترها
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((provider) => (
                    <DoctorCard key={provider.id} provider={provider} />
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
      className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
        active
          ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-100/50'
          : 'bg-white text-gray-600 border-gray-200 hover:border-cyan-300 hover:text-cyan-600 hover:shadow-sm'
      }`}
    >
      {label}
    </button>
  )
}
