import { upcomingDays, toIranianWeekday, toISODate, formatDateFa } from '../utils/date'

const WEEKDAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']

export default function DatePicker({ availableWeekdays = [], selectedDate, onSelect }) {
  const days = upcomingDays(30)

  if (availableWeekdays.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          این ارائه‌دهنده هنوز ساعات کاری خود را تنظیم نکرده است.
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
          لطفاً بعداً دوباره مراجعه کنید یا ارائه‌دهنده دیگری انتخاب کنید.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">انتخاب تاریخ</p>

      {/* Weekday legend */}
      <div className="flex gap-1 mb-1">
        {WEEKDAY_NAMES.map((name, idx) => (
          <span
            key={idx}
            className={`w-8 text-center text-xs ${
              availableWeekdays.includes(idx) ? 'text-cyan-600 font-medium' : 'text-gray-300'
            }`}
          >
            {name}
          </span>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const irWeekday = toIranianWeekday(day)
          const isAvailable = availableWeekdays.includes(irWeekday)
          const iso = toISODate(day)
          const isSelected = selectedDate === iso

          return (
            <button
              key={iso}
              disabled={!isAvailable}
              onClick={() => onSelect(iso)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors
                ${isSelected
                  ? 'bg-cyan-500 text-white'
                  : isAvailable
                  ? 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'}
              `}
              title={isAvailable ? formatDateFa(day) : undefined}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>

      {selectedDate && (
        <p className="text-xs text-cyan-600 mt-1">
          تاریخ انتخاب‌شده: <span dir="ltr">{selectedDate}</span>
        </p>
      )}
    </div>
  )
}
