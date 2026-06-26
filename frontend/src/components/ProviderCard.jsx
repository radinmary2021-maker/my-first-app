import { useNavigate } from 'react-router-dom'
import { formatFee } from '../utils/date'
import ImageAvatar from './ImageAvatar'

export default function ProviderCard({ doctor, provider }) {
  const p = provider ?? doctor
  const navigate = useNavigate()
  const hasRating = p.average_rating != null && p.reviews_count > 0
  const isActive  = (p.available_weekdays ?? []).length > 0
  const name      = p.business_name || p.full_name
  const staffName = p.full_name && p.full_name !== p.business_name ? p.full_name : null
  const category  = p.category_display || p.specialty
  const duration  = p.slot_duration ?? p.visit_duration
  const fee       = p.service_fee ?? p.consultation_fee

  return (
    <div
      onClick={() => navigate(`/providers/${p.id}`)}
      className="rounded-[20px] overflow-hidden cursor-pointer flex transition-all duration-200 group"
      style={{ background: '#0C1520', border: '1px solid rgba(0,212,200,0.07)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.28)'; e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 20px 48px rgba(0,212,200,0.1)' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,200,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* Cover */}
      <div className="w-36 sm:w-48 shrink-0 relative">
        <ImageAvatar src={p.logo} alt={name} fallbackText={name} size="w-full h-full" shape="rounded-none" blurBg />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#00D4C8,transparent)' }} />
        {isActive && (
          <span className="absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(57,255,20,0.15)', border: '1px solid rgba(57,255,20,0.3)', color: '#39FF14', boxShadow: '0 0 10px rgba(57,255,20,0.2)' }}>
            ● باز
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <h2 className="font-bold text-base truncate transition-colors" style={{ color: '#DCF0F5' }}>
            {name}
          </h2>
          {staffName && (
            <p className="text-xs mt-0.5" style={{ color: '#4A6E8A' }}>با مدیریت: <span className="font-semibold" style={{ color: '#DCF0F5' }}>{staffName}</span></p>
          )}
          <p className="text-xs mt-0.5 mb-2" style={{ color: '#4A6E8A' }}>{category}</p>

          {p.services_preview?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {p.services_preview.map((s) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-lg"
                      style={{ background: 'rgba(0,212,200,0.07)', border: '1px solid rgba(0,212,200,0.22)', color: '#00D4C8' }}>{s}</span>
              ))}
            </div>
          )}

          {hasRating && (
            <div className="flex items-center gap-1 mb-3">
              <span className="text-sm" style={{ color: '#FF6B2B' }}>★</span>
              <span className="text-sm font-bold" style={{ color: '#DCF0F5' }}>{p.average_rating}</span>
              <span className="text-xs" style={{ color: '#4A6E8A' }}>({p.reviews_count} نظر)</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,212,200,0.07)' }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: '#4A6E8A' }}>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" style={{ color: '#00D4C8' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              {duration} دقیقه
            </span>
            <span className="w-1 h-1 rounded-full" style={{ background: 'rgba(0,212,200,0.3)' }} />
            <span className="font-semibold" style={{ color: '#00D4C8' }}>{formatFee(fee)}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/providers/${p.id}`) }}
            className="font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer transition-all text-white"
            style={{ background: 'linear-gradient(135deg,#FF6B2B,#FF4500)', boxShadow: '0 0 24px rgba(255,107,43,0.35)' }}
          >
            رزرو نوبت
          </button>
        </div>
      </div>
    </div>
  )
}
