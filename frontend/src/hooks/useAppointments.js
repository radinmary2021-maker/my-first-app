import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMyAppointments, cancelAppointment } from '../api/appointments'

export function useMyAppointments() {
  return useQuery({
    queryKey: ['my-appointments'],
    queryFn: getMyAppointments,
    staleTime: 30_000,
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
    },
  })
}
