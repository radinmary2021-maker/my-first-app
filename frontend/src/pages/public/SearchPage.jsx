import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import SEOHead from '../../components/SEOHead'
import MainLayout from '../../layouts/MainLayout'
import Spinner from '../../components/Spinner'
import ImageAvatar from '../../components/ImageAvatar'
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

  const businesses = useMemo(() => {
    if (!results) return []
    const seen = new Set()
    return results.filter((p) => {
      const key = p.business_id || p.id
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [results])

  return (
    <MainLayout>
      <SEOHead
        title={q ? `جستجو: ${q}` : 'جستجوی کسب‌وکار'}
        description={q ? `نتایج جستجو برای «${q}» در نوبتیک` : 'جستجوی کسب‌وکار و ارائه‌دهنده در نوبتیک'}
        canonical="/search"
      />
      <div className="max-w-3xl mx-auto space-y-6" dir="rtl">

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="نام کسب‌وکار، تخصص یا دسته‌بندی..."
              autoFocus
              className="w-full pr-10 pl-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm
                         focus:outline-none focus:border-cyan-400 focus:bg-white transition-colors"
            />
          </div>
          <button
            type="submit"
            className="text-white px-6 py-3 rounded-2xl text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 60%, #22D3EE 100%)' }}
          >
            جستجو
          </button>
        </form>

        {loading && <div className="flex justify-center py-12"><Spinner /></div>}

        {error && (
          <div className="text-center py-8 text-sm text-red-500">{error}</div>
        )}

        {!q && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-slate-400">عبارت جستجو وارد کنید</p>
          </div>
        )}

        {q && !loading && !error && results?.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-medium text-slate-700">نتیجه‌ای یافت نشد</p>
            <p className="text-sm text-slate-400">جستجوی «{q}» نتیجه‌ای نداشت. کلمه دیگری امتحان کنید.</p>
            <button onClick={() => navigate('/providers')} className="text-sm font-semibold text-cyan-600 hover:text-cyan-700">
              مشاهده همه کسب‌وکارها
            </button>
          </div>
        )}

        {!loading && !error && businesses.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">
              <span className="font-bold text-slate-700">{businesses.length}</span> کسب‌وکار برای «{q}»
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {businesses.map((p, i) => {
                const slug = p.latin_slug || p.business_slug
                const href = slug ? `/book/${slug}` : `/providers/${p.id}`
                const gradients = [
                  'from-cyan-500 to-cyan-400',
                  'from-violet-500 to-violet-400',
                  'from-emerald-500 to-emerald-400',
                  'from-pink-500 to-pink-400',
                ]
                return (
                  <div
                    key={p.business_id || p.id}
                    onClick={() => navigate(href)}
                    className="bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer
                               hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 group"
                  >
                    <ImageAvatar src={p.logo} alt={p.business_name} fallbackText={p.business_name || p.full_name} size="w-full h-24" shape="rounded-none" />
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-cyan-700 transition-colors mb-1">
                        {p.business_name || p.full_name}
                      </h3>
                      <p className="text-xs text-slate-400 mb-3">{p.category_display || p.specialty}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(href) }}
                        className="w-full bg-cyan-50 hover:bg-cyan-500 hover:text-white text-cyan-600 font-bold text-xs py-2.5 rounded-xl
                                   transition-colors border border-cyan-100 hover:border-cyan-500"
                      >
                        مشاهده خدمات و رزرو
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
