import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MainLayout from '../../layouts/MainLayout'
import ErrorMessage from '../../components/ErrorMessage'
import ProviderCard from '../../components/ProviderCard'
import SkeletonCard from '../../components/SkeletonCard'
import { useProviders, useBusinessCategories } from '../../hooks/useDoctors'

const ALL = 'همه'

export default function ProviderListPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { data: providers, isLoading, isError, error } = useProviders()
  const { data: categoriesData } = useBusinessCategories()
  const [selectedCategory, setSelectedCategory] = useState(ALL)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const categoryParam = searchParams.get('category')

  useEffect(() => {
    setSearch(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    if (!categoryParam || !categoriesData?.length || selectedCategory !== ALL) return
    const match = categoriesData.find((c) =>
      typeof c === 'object' ? c.value === categoryParam : c === categoryParam
    )
    if (!match) return
    const label = typeof match === 'string' ? match : (match.label ?? match.value)
    if (label) setSelectedCategory(label)
  }, [categoryParam, categoriesData])

  const categories = useMemo(() => {
    if (categoriesData?.length) {
      return categoriesData.map((c) =>
        typeof c === 'string' ? c : (c.label ?? c.value ?? c)
      ).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fa'))
    }
    if (!providers?.length) return []
    return [...new Set(providers.map((p) => p.category_display || p.specialty).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, 'fa')
    )
  }, [categoriesData, providers])

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
    const matched = providers.filter((p) => {
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
      const matchActive = !showActiveOnly || (p.available_weekdays ?? []).length > 0
      return matchCategory && matchSearch && matchActive
    })
    const seen = new Set()
    return matched.filter((p) => {
      const key = p.business_id || p.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [providers, selectedCategory, search, categoryValueMap, categoryParam, showActiveOnly])

  const effectiveCategory =
    selectedCategory === ALL || categories.includes(selectedCategory)
      ? selectedCategory
      : ALL

  const listTitle = categoryParam
    ? `کسب‌وکارهای ${effectiveCategory !== ALL ? effectiveCategory : categoryParam}`
    : 'کسب‌وکارها و ارائه‌دهندگان'

  function handleSearch(e) {
    e.preventDefault()
    // keep search in state — already filters client-side
  }

  function clearFilters() {
    setSearch('')
    setSelectedCategory(ALL)
    setShowActiveOnly(false)
  }

  const sidebar = (
    <div className="rounded-[20px] overflow-hidden" style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}>
      {/* Category */}
      <div className="p-5" style={{ borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
        <h3 className="text-sm font-bold mb-3" style={{ color: '#DCF0F5' }}>دسته‌بندی</h3>
        <div className="space-y-1">
          <CheckboxItem
            label={ALL}
            checked={effectiveCategory === ALL}
            onChange={() => setSelectedCategory(ALL)}
          />
          {categories.map((c) => (
            <CheckboxItem
              key={c}
              label={c}
              checked={effectiveCategory === c}
              onChange={() => setSelectedCategory(c)}
            />
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="p-5">
        <h3 className="text-sm font-bold mb-3" style={{ color: '#DCF0F5' }}>وضعیت</h3>
        <div className="space-y-1">
          <CheckboxItem
            label="فقط فعال‌ها"
            checked={showActiveOnly}
            onChange={() => setShowActiveOnly(!showActiveOnly)}
          />
        </div>
      </div>
    </div>
  )

  return (
    <MainLayout fullWidth>
      <SEOHead
        title={listTitle}
        description="فهرست کامل کسب‌وکارها و ارائه‌دهندگان در نوبتیک — آرایشگاه، باشگاه، مشاوره، آموزشگاه و بیشتر. نوبت آنلاین بگیرید."
        canonical="/providers"
      />

      {/* Search bar row */}
      <div className="py-4 px-4" style={{ borderBottom: '1px solid rgba(0,212,200,0.07)' }}>
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex items-center flex-1 gap-3 rounded-2xl px-4 py-3 transition-all"
                 style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.18)' }}
                 onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,200,0.45)'}
                 onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,200,0.18)'}>
              <svg className="w-4 h-4 shrink-0" style={{ color: '#00D4C8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی نام کسب‌وکار یا تخصص..."
                className="bg-transparent outline-none text-sm w-full font-medium"
                style={{ color: '#DCF0F5' }}
              />
            </div>
            <button
              type="submit"
              className="text-white font-extrabold text-sm px-6 py-3 rounded-xl transition-all shrink-0"
              style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
            >
              جستجو
            </button>
          </form>

          {/* Active filters */}
          {(effectiveCategory !== ALL || showActiveOnly) && (
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs text-slate-400 self-center">فیلترها:</span>
              {effectiveCategory !== ALL && (
                <button
                  onClick={() => setSelectedCategory(ALL)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full
                             bg-cyan-500 text-white border border-cyan-500"
                >
                  {effectiveCategory}
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
              {showActiveOnly && (
                <button
                  onClick={() => setShowActiveOnly(false)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full
                             bg-cyan-500 text-white border border-cyan-500"
                >
                  فقط فعال‌ها
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6 items-start">

          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
            {sidebar}
          </aside>

          {/* Mobile filter overlay */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="absolute inset-0 bg-black/30" onClick={() => setMobileFilterOpen(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-72 bg-slate-50 p-4 overflow-y-auto shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-800">فیلترها</h2>
                  <button onClick={() => setMobileFilterOpen(false)} className="text-slate-400 hover:text-slate-700">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                {sidebar}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">

            {/* Results header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-lg font-black" style={{ color: '#DCF0F5' }}>{listTitle}</h1>
                {providers && (
                  <p className="text-xs mt-0.5" style={{ color: '#4A6E8A' }}>{filtered.length} نتیجه پیدا شد</p>
                )}
              </div>
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M7 12h10M11 18h2" /></svg>
                فیلتر
              </button>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Error */}
            {isError && (
              <ErrorMessage message={error?.response?.data?.error || 'خطا در دریافت لیست ارائه‌دهندگان'} />
            )}

            {/* Results list */}
            {!isLoading && !isError && providers && (
              <div aria-live="polite">
                {filtered.length === 0 ? (
                  <div className="text-center py-24 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8 text-cyan-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="font-medium text-slate-700">نتیجه‌ای یافت نشد</p>
                    <button
                      onClick={clearFilters}
                      className="text-cyan-600 text-sm font-semibold hover:text-cyan-800
                                 bg-cyan-50 px-4 py-2 rounded-lg hover:bg-cyan-100 transition-colors"
                    >
                      پاک کردن فیلترها
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filtered.map((provider) => (
                      <ProviderCard key={provider.id} provider={provider} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

function CheckboxItem({ label, checked, onChange }) {
  return (
    <label onClick={onChange} className="flex items-center gap-3 py-2 px-2 rounded-xl cursor-pointer transition-colors"
           style={{ color: checked ? '#00D4C8' : '#4A6E8A' }}>
      <div className="w-4 h-4 rounded shrink-0 flex items-center justify-center transition-colors"
           style={checked
             ? { border: '2px solid #00D4C8', background: '#00D4C8' }
             : { border: '2px solid rgba(0,212,200,0.2)' }
           }>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        )}
      </div>
      <span className="text-sm" style={{ color: checked ? '#DCF0F5' : '#4A6E8A', fontWeight: checked ? 500 : 400 }}>{label}</span>
    </label>
  )
}
