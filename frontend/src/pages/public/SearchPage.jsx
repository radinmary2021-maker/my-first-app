import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import Badge from '../../components/Badge'
import { SearchIcon, BuildingIcon, UserIcon, AlertCircleIcon } from '../../components/Icon'
import { getProviders } from '../../api/providers'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate  = useNavigate()
  const q         = searchParams.get('q') || ''
  const [input,   setInput]   = useState(q)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    if (!q.trim()) { setResults(null); return }
    setLoading(true)
    setError('')
    getProviders({ q: q.trim() })
      .then((data) => setResults(data))
      .catch(() => setError('خطا در جستجو. دوباره تلاش کنید.'))
      .finally(() => setLoading(false))
  }, [q])

  function handleSearch(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if (trimmed) setSearchParams({ q: trimmed })
  }

  // Derive unique businesses from provider results
  const businesses = useMemo(() => {
    if (!results) return []
    const seen = new Set()
    return results
      .filter((p) => p.business_name && !seen.has(p.business_name) && seen.add(p.business_name))
      .map((p) => ({ name: p.business_name, category: p.category_display || p.category }))
  }, [results])

  return (
    <MainLayout>
      <SEOHead
        title={q ? `جستجو: ${q}` : 'جستجوی کسب‌وکار'}
        description={q ? `نتایج جستجو برای «${q}» در نوبتیک` : 'جستجوی کسب‌وکار و ارائه‌دهنده در نوبتیک'}
        canonical="/search"
      />
      <div className="max-w-2xl space-y-6" dir="rtl">

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="نام کسب‌وکار، تخصص یا دسته‌بندی..."
              autoFocus
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="text-white px-5 py-3 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            جستجو
          </button>
        </form>

        {/* Loading */}
        {loading && <div className="flex justify-center py-12"><Spinner /></div>}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 py-8 justify-center text-sm"
               style={{ color: 'var(--color-danger)' }}>
            <AlertCircleIcon size={16} />
            {error}
          </div>
        )}

        {/* No query yet */}
        {!q && !loading && (
          <div className="text-center py-16" style={{ color: 'var(--color-text-tertiary)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3"
                 style={{ backgroundColor: 'var(--color-surface)' }}>
              <SearchIcon size={32} />
            </div>
            <p className="text-sm">عبارت جستجو وارد کنید</p>
          </div>
        )}

        {/* No results */}
        {q && !loading && !error && results?.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                 style={{ backgroundColor: 'var(--color-surface)' }}>
              <SearchIcon size={32} style={{ color: 'var(--color-text-tertiary)' }} />
            </div>
            <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>نتیجه‌ای یافت نشد</p>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              جستجوی «{q}» نتیجه‌ای نداشت. کلمه دیگری امتحان کنید.
            </p>
            <button
              onClick={() => navigate('/providers')}
              className="text-sm font-medium hover:underline"
              style={{ color: 'var(--color-brand)' }}
            >
              مشاهده همه ارائه‌دهندگان
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results && results.length > 0 && (
          <div className="space-y-8">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {results.length}
              </span>{' '}
              نتیجه برای «{q}»
            </p>

            {/* Businesses section */}
            {businesses.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold flex items-center gap-2"
                    style={{ color: 'var(--color-text-primary)' }}>
                  <BuildingIcon size={18} style={{ color: 'var(--color-brand)' }} />
                  کسب‌وکارها
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full"
                        style={{ color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-surface)' }}>
                    {businesses.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {businesses.map((biz) => (
                    <div
                      key={biz.name}
                      className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                    >
                      <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                        {biz.name}
                      </p>
                      {biz.category && (
                        <p className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full"
                           style={{ color: 'var(--color-brand)', backgroundColor: 'var(--color-brand-light)' }}>
                          {biz.category}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Providers section */}
            <section className="space-y-3">
              <h2 className="text-base font-bold flex items-center gap-2"
                  style={{ color: 'var(--color-text-primary)' }}>
                <UserIcon size={18} style={{ color: 'var(--color-brand)' }} />
                ارائه‌دهندگان
                <span className="text-xs font-normal px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--color-text-tertiary)', backgroundColor: 'var(--color-surface)' }}>
                  {results.length}
                </span>
              </h2>
              <div className="space-y-2">
                {results.map((p) => (
                  <Link
                    key={p.id}
                    to={`/providers/${p.id}`}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:border-cyan-200 hover:shadow-md transition-all"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {p.business_name || p.full_name}
                        </p>
                        {!(p.available_weekdays?.length > 0) && (
                          <Badge variant="neutral">هنوز فعال نشده</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {(p.category_display || p.specialty) && (
                          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {p.category_display || p.specialty}
                          </span>
                        )}
                        {p.business_name && p.full_name && (
                          <span className="text-xs" style={{ color: 'var(--color-brand)' }}>
                            {p.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm shrink-0 mr-2" style={{ color: 'var(--color-brand)' }}>
                      رزرو ←
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
