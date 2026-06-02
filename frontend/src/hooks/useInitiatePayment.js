import { useMutation } from '@tanstack/react-query'
import { initiatePayment } from '../api/payments'

function parsePaymentError(err) {
  const data = err?.response?.data
  if (!data) return 'خطا در ارتباط با سرور'
  return data.error || 'خطا در اتصال به درگاه پرداخت'
}

export function useInitiatePayment() {
  const mutation = useMutation({
    mutationFn: initiatePayment,
  })

  return {
    initiate: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error ? parsePaymentError(mutation.error) : null,
  }
}
