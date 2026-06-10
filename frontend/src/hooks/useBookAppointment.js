import { useMutation } from '@tanstack/react-query'
import { createAppointment } from '../api/appointments'

function parseBookingError(err) {
  const data = err?.response?.data
  if (!data) return 'خطا در ارتباط با سرور'

  // Field errors from DRF
  const fieldMsg =
    data.non_field_errors?.[0] ||
    data.start_time?.[0] ||
    data.date?.[0] ||
    data.provider_id?.[0]

  if (fieldMsg) return fieldMsg

  // Service-level errors
  if (data.error) {
    if (data.error.includes('قبلاً رزرو')) return 'این زمان دیگر در دسترس نیست'
    if (data.error.includes('اسلات')) return 'این زمان دیگر در دسترس نیست'
    return data.error
  }

  return 'خطا در ثبت نوبت'
}

export function useBookAppointment() {
  const mutation = useMutation({
    mutationFn: createAppointment,
  })

  return {
    book: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error ? parseBookingError(mutation.error) : null,
    reset: mutation.reset,
  }
}
