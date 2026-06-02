import client from './client'

export function initiatePayment(appointmentId) {
  return client
    .post(`/api/payments/${appointmentId}/initiate/`)
    .then((r) => r.data)
}
