// Backend weekday: 0=Saturday … 6=Friday (Iranian week)
// JS Date.getDay():  0=Sunday, 1=Monday … 6=Saturday

const JS_TO_IR = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 }

/** Convert a JS Date to backend weekday integer (0=Sat … 6=Fri) */
export function toIranianWeekday(jsDate) {
  return JS_TO_IR[jsDate.getDay()]
}

/** Format a Date as YYYY-MM-DD (Gregorian) for backend */
export function toISODate(jsDate) {
  const y = jsDate.getFullYear()
  const m = String(jsDate.getMonth() + 1).padStart(2, '0')
  const d = String(jsDate.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const IR_WEEKDAY_NAMES = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']
const MONTH_NAMES = [
  'ژانویه', 'فوریه', 'مارس', 'آوریل', 'مه', 'ژوئن',
  'ژوئیه', 'اوت', 'سپتامبر', 'اکتبر', 'نوامبر', 'دسامبر',
]

/** "شنبه ۶ ژوئن ۲۰۲۶" */
export function formatDateFa(jsDate) {
  const wd = IR_WEEKDAY_NAMES[toIranianWeekday(jsDate)]
  const d = jsDate.getDate()
  const m = MONTH_NAMES[jsDate.getMonth()]
  const y = jsDate.getFullYear()
  return `${wd} ${d} ${m} ${y}`
}

/** Build an array of the next `count` days starting today */
export function upcomingDays(count = 30) {
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

/** Format consultation_fee from backend ("300000") → "۳۰۰٬۰۰۰ تومان" */
export function formatFee(rials) {
  const toman = Math.round(Number(rials) / 10)
  return toman.toLocaleString('fa-IR') + ' تومان'
}
