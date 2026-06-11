import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMyAppointments,
  cancelAppointment,
  getProviderAppointments,
  getBusinessAppointments,
  completeAppointment,
  noShowAppointment,
  confirmAppointment,
} from '../api/appointments'

export const BUSINESS_APPOINTMENTS_KEY = ['business-appointments']
export const PROVIDER_APPOINTMENTS_KEY = ['provider-appointments']

export function useMyAppointments() {
  return useQuery({
    queryKey: ['my-appointments'],
    queryFn: getMyAppointments,
    staleTime: 30_000,
  })
}

/**
 * Owner-only: all appointments across the business.
 * Pass { enabled: false } when the current user is not an owner.
 */
export function useBusinessAppointments(params = {}, options = {}) {
  return useQuery({
    queryKey: [...BUSINESS_APPOINTMENTS_KEY, params],
    queryFn: () => getBusinessAppointments(params),
    staleTime: 30_000,
    ...options,
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => cancelAppointment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-appointments'] }),
  })
}

export function useProviderAppointments(params = {}, options = {}) {
  return useQuery({
    queryKey: [...PROVIDER_APPOINTMENTS_KEY, params],
    queryFn: () => getProviderAppointments(params),
    staleTime: 30_000,
    ...options,
  })
}
/** @deprecated */
export const useDoctorAppointments = useProviderAppointments

export function useCompleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => completeAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_APPOINTMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: BUSINESS_APPOINTMENTS_KEY })
    },
  })
}

export function useNoShowAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => noShowAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_APPOINTMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: BUSINESS_APPOINTMENTS_KEY })
    },
  })
}

export function useProviderCancelAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => cancelAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_APPOINTMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: BUSINESS_APPOINTMENTS_KEY })
    },
  })
}
/** @deprecated */
export const useDoctorCancelAppointment = useProviderCancelAppointment

export function useConfirmAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => confirmAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROVIDER_APPOINTMENTS_KEY })
      queryClient.invalidateQueries({ queryKey: BUSINESS_APPOINTMENTS_KEY })
    },
  })
}
