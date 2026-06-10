import client from './client'

export function createAppointment({ providerId, serviceId, date, startTime, notes = '' }) {
  return client
    .post('/api/appointments/', {
      provider_id: providerId,
      service_id:  serviceId ?? null,
      date,
      start_time:  startTime,
      notes,
    })
    .then((r) => r.data)
}

export function trackAppointment(code) {
  return client.get(`/api/appointments/track/${code}/`).then((r) => r.data)
}

export function getMyAppointments() {
  return client.get('/api/appointments/mine/').then((r) => r.data)
}

export function cancelAppointment(id) {
  return client.post(`/api/appointments/${id}/cancel/`).then((r) => r.data)
}

export function getProviderAppointments(params = {}) {
  return client.get('/api/appointments/provider/', { params }).then((r) => r.data)
}

/**
 * Owner/staff: fetch ALL appointments for the authenticated user's business.
 * Filterable by ?date=, ?status=, ?provider_id=
 * Returns StaffAppointmentSerializer shape (includes provider_name, customer info).
 */
export function getBusinessAppointments(params = {}) {
  return client.get('/api/v1/appointments/business/', { params }).then((r) => r.data)
}

export function completeAppointment(id) {
  return client.post(`/api/appointments/${id}/complete/`).then((r) => r.data)
}

export function noShowAppointment(id) {
  return client.post(`/api/appointments/${id}/no-show/`).then((r) => r.data)
}
