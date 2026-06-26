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
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#00D4C8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="نام کسب‌وکار، تخصص یا دسته‌بندی..."
              autoFocus
              className="w-full pr-10 pl-4 py-3 rounded-2xl text-sm outline-none transition-all"
              style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.18)', color: '#DCF0F5' }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,200,0.45)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(0,212,200,0.18)'}
            />
          </div>
          <button
            type="submit"
            className="text-white px-6 py-3 rounded-2xl text-sm font-extrabold transition-all"
            style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
          >
            جستجو
          </button>
        </form>

        {loading && <div className="flex justify-center py-12"><Spinner /></div>}

        {error && (
          <div className="text-center py-8 text-sm" style={{ color: '#EF4444' }}>{error}</div>
        )}

        {!q && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(0,212,200,0.06)' }}>
              <svg className="w-8 h-8" style={{ color: '#4A6E8A' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: '#4A6E8A' }}>عبارت جستجو وارد کنید</p>
          </div>
        )}

        {q && !loading && !error && results?.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'rgba(0,212,200,0.06)' }}>
              <svg className="w-8 h-8" style={{ color: '#4A6E8A' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
            </div>
            <p className="font-medium" style={{ color: '#DCF0F5' }}>نتیجه‌ای یافت نشد</p>
            <p className="text-sm" style={{ color: '#4A6E8A' }}>جستجوی «{q}» نتیجه‌ای نداشت. کلمه دیگری امتحان کنید.</p>
            <button onClick={() => navigate('/providers')} className="text-sm font-semibold" style={{ color: '#00D4C8' }}>
              مشاهده همه کسب‌وکارها
            </button>
          </div>
        )}

        {!loading && !error && businesses.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: '#4A6E8A' }}>
              <span className="font-bold" style={{ color: '#DCF0F5' }}>{businesses.length}</span> کسب‌وکار برای «{q}»
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {businesses.map((p) => {
                const slug = p.latin_slug || p.business_slug
                const href = slug ? `/book/${slug}` : `/providers/${p.id}`
                return (
                  <div
                    key={p.business_id || p.id}
                    onClick={() => navigate(href)}
                    className="rounded-[20px] overflow-hidden cursor-pointer transition-all duration-200 group"
                    style={{ background: '#132030', border: '1px solid rgba(0,212,200,0.07)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.28)'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,212,200,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div className="relative">
                      <ImageAvatar src={p.logo} alt={p.business_name} fallbackText={p.business_name || p.full_name} size="w-full h-24" shape="rounded-none" blurBg />
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#00D4C8,transparent)' }} />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-sm mb-1 transition-colors" style={{ color: '#DCF0F5' }}>
                        {p.business_name || p.full_name}
                      </h3>
                      <p className="text-xs mb-3" style={{ color: '#4A6E8A' }}>{p.category_display || p.specialty}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(href) }}
                        className="w-full font-extrabold text-xs py-2.5 rounded-xl transition-all text-white"
                        style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
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
