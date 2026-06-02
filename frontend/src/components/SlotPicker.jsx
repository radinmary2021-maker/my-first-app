import Spinner from './Spinner'

export default function SlotPicker({ slots, isLoading, selectedSlot, onSelect }) {
  if (isLoading) {
    return <Spinner className="py-6" />
  }

  if (!slots) return null

  if (slots.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-xl text-sm text-gray-400">
        اسلات خالی در این تاریخ وجود ندارد
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">انتخاب ساعت</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            className={`
              py-2.5 rounded-xl text-sm font-mono font-medium transition-colors border
              ${selectedSlot === slot
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600'}
            `}
          >
            {slot}
          </button>
        ))}
      </div>
    </div>
  )
}
