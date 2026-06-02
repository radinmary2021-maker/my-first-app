import { useNavigate } from 'react-router-dom'
import { formatFee } from '../utils/date'

const WEEKDAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

export default function DoctorCard({ doctor }) {
  const navigate = useNavigate()

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-gray-800">{doctor.full_name}</h2>
          <p className="text-sm text-blue-600 mt-0.5">{doctor.specialty}</p>
        </div>
        <span className="text-xs bg-green-50 text-green-700 border border-green-100 rounded-full px-3 py-1 whitespace-nowrap">
          فعال
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
        <span>⏱ {doctor.visit_duration} دقیقه</span>
        <span>💰 {formatFee(doctor.consultation_fee)}</span>
      </div>

      {doctor.available_weekdays?.length > 0 && (
        <div className="flex gap-1">
          {WEEKDAY_NAMES.map((name, idx) => (
            <span
              key={idx}
              className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium ${
                doctor.available_weekdays.includes(idx)
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-300'
              }`}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate(`/doctors/${doctor.id}`)}
        className="mt-auto w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        مشاهده و رزرو
      </button>
    </div>
  )
}
