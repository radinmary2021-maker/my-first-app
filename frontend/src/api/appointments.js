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
