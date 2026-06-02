import client from './client'

export function createAppointment({ doctorId, date, startTime }) {
  return client
    .post('/api/appointments/', {
      doctor_id: doctorId,
      date,
      start_time: startTime,
    })
    .then((r) => r.data)
}

export function getMyAppointments() {
  return client.get('/api/appointments/mine/').then((r) => r.data)
}

export function cancelAppointment(id) {
  return client.post(`/api/appointments/${id}/cancel/`).then((r) => r.data)
}
