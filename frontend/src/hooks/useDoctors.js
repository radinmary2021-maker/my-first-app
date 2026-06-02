import { useQuery } from '@tanstack/react-query'
import { getDoctors, getDoctor, getDoctorSlots } from '../api/doctors'

export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    staleTime: 5 * 60_000,
  })
}

export function useDoctor(id) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => getDoctor(id),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  })
}

export function useDoctorSlots(id, date) {
  return useQuery({
    queryKey: ['doctor-slots', id, date],
    queryFn: () => getDoctorSlots(id, date),
    enabled: Boolean(id) && Boolean(date),
    staleTime: 60_000,
  })
}
