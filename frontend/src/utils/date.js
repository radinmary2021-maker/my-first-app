/**
 * Format a consultation fee as Iranian Toman currency.
 * Example: 500000 → "۵۰۰٬۰۰۰ تومان"
 */
export function formatFee(fee) {
  if (fee == null) return '—'
  return `${Number(fee).toLocaleString('fa-IR')} تومان`
}

/**
 * Return an array of the next `count` days starting from today (local timezone).
 * @param {number} count
 * @returns {Date[]}
 */
export function upcomingDays(count) {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < count; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

/**
 * Convert a JS Date to Iranian weekday index.
 * Iranian week: 0=شنبه, 1=یکشنبه, 2=دوشنبه, ..., 6=جمعه
 * JS getDay():  0=Sunday, 1=Monday, ..., 6=Saturday
 * Formula: (jsDay + 1) % 7
 */
export function toIranianWeekday(date) {
  return (date.getDay() + 1) % 7
}

/**
 * Format a Date as a YYYY-MM-DD string in local timezone.
 * (Avoids UTC drift from toISOString())
 */
export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Format a Date in Persian locale for human-readable display.
 * Example: "شنبه ۱۲ تیر"
 */
export function formatDateFa(date) {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
    }).format(date)
  } catch {
    return toISODate(date)
  }
}
