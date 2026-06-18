import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MainLayout from '../../layouts/MainLayout'
import ErrorMessage from '../../components/ErrorMessage'
import DoctorCard from '../../components/DoctorCard'
import SkeletonCard from '../../components/SkeletonCard'
import { SearchIcon, UsersIcon } from '../../components/Icon'
import { useProviders, useBusinessCategories } from '../../hooks/useDoctors'

const ALL = 'همه'

export default function DoctorListPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: providers, isLoading, isError, error } = useProviders()
  const { data: categoriesData } = useBusinessCategories()
  const [selectedCategory, setSelectedCategory] = useState(ALL)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const categoryParam = searchParams.get('category') // e.g. 'beauty', 'fitness'

  useEffect(() => {
    setSearch(searchParams.get('q') || '')
  }, [searchParams])

  // When categories load, auto-select the chip matching ?category= URL param
  useEffect(() => {
    if (!categoryParam || !categoriesData?.length || selectedCategory !== ALL) return
    const match = categoriesData.find((c) =>
      typeof c === 'object' ? c.value === categoryParam : c === categoryParam
    )
    if (!match) return
    const label = typeof match === 'string' ? match : (match.label ?? match.value)
    if (label) setSelectedCategory(label)
  }, [categoryParam, categoriesData])

  // Build category filter list from API first, fall back to provider-derived list
  const categories = useMemo(() => {
    // API may return [{value, label}] or ['medical', ...] — normalize to label strings
    if (categoriesData?.length) {
      return categoriesData.map((c) =>
        typeof c === 'string' ? c : (c.label ?? c.value ?? c)
      ).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fa'))
    }
    // Fallback: derive from loaded providers
    if (!providers?.length) return []
    return [...new Set(providers.map((p) => p.category_display || p.specialty).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'fa')
    )
  }, [categoriesData, providers])

  // Also keep value→label map so we can filter by both category_display and raw value
  const categoryValueMap = useMemo(() => {
    if (!categoriesData?.length) return {}
    const map = {}
    categoriesData.forEach((c) => {
      if (typeof c === 'object' && c.value && c.label) map[c.label] = c.value
    })
    return map
  }, [categoriesData])

  const filtered = useMemo(() => {
    if (!providers) return []
    return providers.filter((p) => {
      const catDisplay = p.category_display || p.specialty || ''
      const catValue   = p.category || ''
      const name       = p.business_name || p.full_name || ''
      const matchCategory =
        selectedCategory !== ALL
          ? catDisplay === selectedCategory || catValue === categoryValueMap[selectedCategory]
          : !categoryParam || catValue === categoryParam
      const matchSearch =
        !search.trim() ||
        name.includes(search.trim()) ||
        catDisplay.includes(search.trim())
      return matchCategory && matchSearch
    })
  }, [providers, selectedCategory, search, categoryValueMap, categoryParam])

  const effectiveCategory =
    selectedCategory === ALL || categories.includes(selectedCategory)
      ? selectedCategory
      : ALL

  const listTitle = categoryParam
    ? `کسب‌وکارهای ${effectiveCategory !== ALL ? effectiveCategory : categoryParam}`
    : 'کسب‌وکارها و ارائه‌دهندگان'

  return (
    <MainLayout>
      <SEOHead
        title={listTitle}
        description="فهرست کامل کسب‌وکارها و ارائه‌دهندگان در نوبتیک — آرایشگاه، باشگاه، مشاوره، آموزشگاه و بیشتر. نوبت آنلاین بگیرید."
        canonical="/providers"
      />
      <div className="space-y-6">

        {/* Page header */}
        <div className="bg-gradient-to-l from-cyan-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg shadow-cyan-100/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <UsersIcon size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">لیست ارائه‌دهندگان</h1>
              <p className="text-cyan-100 text-xs mt-0.5">
                {providers
                  ? `${providers.length} ارائه‌دهنده آماده ثبت نوبت`
                  : 'ارائه‌دهنده مورد نظر خود را پیدا کنید'}
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="جستجو بر اساس نام کسب‌وکار، تخصص یا دسته‌بندی..."
              className="w-full pr-10 pl-4 py-3 bg-white rounded-xl text-sm text-gray-800
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-300
                         shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Loading skeletons */}
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

        {/* Error */}
        {isError && (
          <ErrorMessage message={error?.response?.data?.error || 'خطا در دریافت لیست ارائه‌دهندگان'} />
        )}

        {/* Content */}
        {!isLoading && !isError && providers && (
          <>
            {/* Category filter chips */}
            {categories.length >= 2 && (
              <div role="group" aria-label="فیلتر دسته‌بندی" className="flex flex-wrap gap-2">
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
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                       style={{ backgroundColor: 'var(--color-brand-light)' }}>
                    <SearchIcon size={32} style={{ color: 'var(--color-brand)' }} />
                  </div>
                  <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    نتیجه‌ای یافت نشد
                  </p>
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
