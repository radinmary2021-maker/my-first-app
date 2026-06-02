import client from './client'

export function getDoctors() {
  return client.get('/api/doctors/').then((r) => r.data)
}

export function getDoctor(id) {
  return client.get(`/api/doctors/${id}/`).then((r) => r.data)
}

export function getDoctorSlots(id, date) {
  return client
    .get(`/api/doctors/${id}/slots/`, { params: { date } })
    .then((r) => r.data)
}
