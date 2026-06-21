import { useNavigate } from 'react-router-dom'
import { formatFee } from '../utils/date'
import ProviderAvatar from './ProviderAvatar'

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#0891B2,#06B6D4)',
  'linear-gradient(135deg,#7C3AED,#A78BFA)',
  'linear-gradient(135deg,#DB2777,#F472B6)',
  'linear-gradient(135deg,#0F766E,#2DD4BF)',
  'linear-gradient(135deg,#059669,#34D399)',
  'linear-gradient(135deg,#B45309,#FCD34D)',
]

function gradientFor(id) {
  return COVER_GRADIENTS[(id ?? 0) % COVER_GRADIENTS.length]
}

export default function ProviderCard({ doctor, provider }) {
  const p = provider ?? doctor
  const navigate = useNavigate()
  const hasRating = p.average_rating != null && p.reviews_count > 0
  const isActive  = (p.available_weekdays ?? []).length > 0
  const name      = p.business_name || p.full_name
  const category  = p.category_display || p.specialty
  const duration  = p.slot_duration ?? p.visit_duration
  const fee       = p.service_fee ?? p.consultation_fee

  return (
    <div
      onClick={() => navigate(`/providers/${p.id}`)}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer flex
                 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 group"
    >
      {/* Cover */}
      <div
        className="w-36 sm:w-48 shrink-0 relative"
        style={{ background: gradientFor(p.id) }}
      >
        {p.logo ? (
          <img src={p.logo} alt={name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-40">
            <ProviderAvatar name={name} size={64} />
          </div>
        )}
        {isActive && (
          <div className="absolute top-2 right-2 bg-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            فعال
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <h2 className="font-bold text-slate-900 text-base group-hover:text-cyan-700 transition-colors truncate">
            {name}
          </h2>
          <p className="text-slate-400 text-xs mt-0.5 mb-2">{category}</p>

          {p.services_preview?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {p.services_preview.map((s) => (
                <span key={s} className="bg-slate-50 border border-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-lg">{s}</span>
              ))}
            </div>
          )}

          {hasRating && (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-amber-400 text-sm">★</span>
              <span className="text-sm font-bold text-slate-700">{p.average_rating}</span>
              <span className="text-xs text-slate-400">({p.reviews_count} نظر)</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              {duration} دقیقه
            </span>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <span className="text-cyan-600 font-semibold">{formatFee(fee)}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/providers/${p.id}`) }}
            className="bg-cyan-50 hover:bg-cyan-500 hover:text-white text-cyan-600 font-bold text-xs px-4 py-2 rounded-xl
                       transition-colors border border-cyan-100 hover:border-cyan-500"
          >
            رزرو نوبت
          </button>
        </div>
      </div>
    </div>
  )
}
