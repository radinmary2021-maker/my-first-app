import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
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
      <div className="max-w-2xl space-y-6" dir="rtl">

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="نام کسب‌وکار، تخصص یا ارائه‌دهنده..."
              autoFocus
              className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-cyan-500 text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-cyan-600 transition-colors"
          >
            جستجو
          </button>
        </form>

        {/* Loading */}
        {loading && <div className="flex justify-center py-12"><Spinner /></div>}

        {/* Error */}
        {error && <p className="text-sm text-red-600 text-center py-8">{error}</p>}

        {/* No query yet */}
        {!q && !loading && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-sm">عبارت جستجو وارد کنید</p>
          </div>
        )}

        {/* No results */}
        {q && !loading && !error && results?.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-4xl">😕</p>
            <p className="text-gray-600 font-medium">نتیجه‌ای یافت نشد</p>
            <p className="text-sm text-gray-400">
              جستجوی «{q}» نتیجه‌ای نداشت. کلمه دیگری امتحان کنید.
            </p>
            <button
              onClick={() => navigate('/providers')}
              className="text-sm text-cyan-600 hover:underline font-medium"
            >
              مشاهده همه ارائه‌دهندگان
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results && results.length > 0 && (
          <div className="space-y-8">
            <p className="text-sm text-gray-500">
              <span className="font-medium text-gray-800">{results.length}</span> نتیجه برای «{q}»
            </p>

            {/* Businesses section */}
            {businesses.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
                  <span className="text-lg">🏢</span>
                  کسب‌وکارها
                  <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {businesses.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {businesses.map((biz) => (
                    <div
                      key={biz.name}
                      className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm"
                    >
                      <p className="font-semibold text-gray-800 truncate">{biz.name}</p>
                      {biz.category && (
                        <p className="text-xs text-cyan-600 mt-1 bg-cyan-50 inline-block px-2 py-0.5 rounded-full">
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
              <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
                <span className="text-lg">👤</span>
                ارائه‌دهندگان
                <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
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
                      <p className="font-semibold text-gray-800 truncate">{p.full_name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {p.specialty && (
                          <span className="text-xs text-gray-500">{p.specialty}</span>
                        )}
                        {p.business_name && (
                          <span className="text-xs text-cyan-600">{p.business_name}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-cyan-500 text-sm shrink-0 mr-2">رزرو ←</span>
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
