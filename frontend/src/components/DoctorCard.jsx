import { useNavigate } from 'react-router-dom'
import { formatFee } from '../utils/date'
import DoctorAvatar from './DoctorAvatar'
import Badge from './Badge'
import { CATEGORY_ICON, BriefcaseIcon } from './Icon'

const WEEKDAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

/** Deterministic pseudo-rating 4.3–4.9 based on provider id */
function getRating(id) {
  const seed = typeof id === 'number' ? id : parseInt(id, 10) || 0
  return (4.3 + (seed % 7) * 0.1).toFixed(1)
}

function StarRating({ value }) {
  const full = Math.floor(value)
  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-px">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`w-3 h-3 ${i < full ? 'text-amber-400' : 'text-gray-200'}`}
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs text-gray-400 font-medium">{value}</span>
    </div>
  )
}

/** Accepts both `doctor` (legacy) and `provider` prop names */
export default function DoctorCard({ doctor, provider }) {
  const p = provider ?? doctor   // support both prop names
  const navigate = useNavigate()
  const rating = parseFloat(getRating(p.id))

  const CategoryIcon = CATEGORY_ICON[p.category] ?? BriefcaseIcon

  return (
    <div
      onClick={() => navigate(`/providers/${p.id}`)}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
                 hover:shadow-xl hover:-translate-y-0.5 hover:border-cyan-100
                 transition-all duration-300 cursor-pointer group flex flex-col"
    >
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 to-cyan-400 shrink-0" />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header: avatar + name + badge */}
        <div className="flex items-start gap-3">
          <div className="shrink-0 ring-2 ring-cyan-50 rounded-full">
            <DoctorAvatar name={p.business_name || p.full_name} size={58} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <h2 className="text-sm font-bold text-gray-800 group-hover:text-cyan-700
                             transition-colors leading-snug truncate">
                {p.business_name || p.full_name}
              </h2>
              {p.available_weekdays?.length > 0
                ? <Badge variant="success">فعال</Badge>
                : <Badge variant="neutral">هنوز فعال نشده</Badge>
              }
            </div>

            {/* Category with icon */}
            <div className="flex items-center gap-1 text-xs font-semibold mb-1.5"
                 style={{ color: 'var(--color-brand)' }}>
              <CategoryIcon size={12} />
              <span>{p.category_display || p.specialty}</span>
            </div>

            <StarRating value={rating} />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-50" />

        {/* Info row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500">
            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{p.slot_duration ?? p.visit_duration} دقیقه</span>
          </div>
          <span className="font-bold text-gray-700 text-sm">
            {formatFee(p.service_fee ?? p.consultation_fee)}
          </span>
        </div>

        {/* Weekday chips */}
        {p.available_weekdays?.length > 0 && (
          <div className="flex gap-1">
            {WEEKDAY_NAMES.map((name, idx) => (
              <span
                key={idx}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                  p.available_weekdays.includes(idx)
                    ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-100'
                    : 'bg-gray-50 text-gray-300'
                }`}
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/providers/${p.id}`) }}
          className="mt-auto w-full bg-cyan-500 text-white py-2.5 rounded-xl text-sm font-bold
                     hover:bg-cyan-600 active:scale-[.98]
                     group-hover:shadow-lg group-hover:shadow-cyan-100/60
                     transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>رزرو نوبت</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
               stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
