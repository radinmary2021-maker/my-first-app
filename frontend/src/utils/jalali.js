const G_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const J_DAYS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29]

export const JALALI_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
]

function _g2j(gy, gm, gd) {
  const y = gy - 1600
  const m = gm - 1
  const d = gd - 1

  let dno =
    365 * y +
    Math.floor((y + 3) / 4) -
    Math.floor((y + 99) / 100) +
    Math.floor((y + 399) / 400)

  for (let i = 0; i < m; i++) dno += G_DAYS[i]
  if (m > 1 && ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0)) dno++
  dno += d

  let jdno = dno - 79
  const cycles = Math.floor(jdno / 12053)
  jdno %= 12053

  let jy = 979 + 33 * cycles + 4 * Math.floor(jdno / 1461)
  jdno %= 1461

  if (jdno >= 366) {
    jy += Math.floor((jdno - 1) / 365)
    jdno = (jdno - 1) % 365
  }

  let i
  for (i = 0; i < 11 && jdno >= J_DAYS[i]; i++) jdno -= J_DAYS[i]

  return [jy, i + 1, jdno + 1]
}

/** Convert a JS Date to Jalali {jy, jm, jd} */
export function getJalali(date) {
  const [jy, jm, jd] = _g2j(date.getFullYear(), date.getMonth() + 1, date.getDate())
  return { jy, jm, jd }
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
export function toFa(n) {
  return String(n).replace(/\d/g, d => FA_DIGITS[d])
}

/** Convert "YYYY-MM-DD" → "۲۵ خرداد ۱۴۰۵" */
export function toJalali(gregorianDateStr) {
  if (!gregorianDateStr) return ''
  const [gy, gm, gd] = gregorianDateStr.split('-').map(Number)
  const [jy, jm, jd] = _g2j(gy, gm, gd)
  return `${toFa(jd)} ${JALALI_MONTH_NAMES[jm - 1]} ${toFa(jy)}`
}

const WEEKDAY_NAMES = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']

/**
 * Convert "YYYY-MM-DD" to Jalali with optional weekday.
 * { withWeekday: true }  → "یکشنبه ۳۰ فروردین"
 * { withYear: true }     → "۳۰ فروردین ۱۴۰۴"  (default)
 */
export function formatJalaliDate(gregorianDateStr, { withWeekday = false, withYear = true } = {}) {
  if (!gregorianDateStr) return ''
  const [gy, gm, gd] = gregorianDateStr.split('-').map(Number)
  const [jy, jm, jd] = _g2j(gy, gm, gd)
  const dayMonth = `${toFa(jd)} ${JALALI_MONTH_NAMES[jm - 1]}`
  const parts = []
  if (withWeekday) {
    const dt = new Date(gy, gm - 1, gd)
    parts.push(WEEKDAY_NAMES[dt.getDay()])
  }
  parts.push(dayMonth)
  if (withYear) parts.push(toFa(jy))
  return parts.join(' ')
}
