/**
 * hooks/useDoctorSchedule.js
 *
 * Hooks for the business management panel:
 *   - Services CRUD
 *   - Working Hours CRUD + bulk upsert
 *   - Time Off CRUD
 *   - Provider profile
 *
 * All mutate to /api/v1/businesses/me/... (staff/owner only).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMyProviderProfile,
  updateMyProviderProfile,
  getMyServices,
  createService,
  updateService,
  deleteService,
  getMyWorkingHours,
  createWorkingHours,
  updateWorkingHours,
  deleteWorkingHours,
  bulkUpdateWorkingHours,
  getMyTimeOffs,
  createTimeOff,
  deleteTimeOff,
} from '../api/providers'


// ── Provider profile ──────────────────────────────────────────────────────────

export function useMyProviderProfile() {
  return useQuery({
    queryKey: ['my-provider-profile'],
    queryFn:  getMyProviderProfile,
    staleTime: 60_000,
  })
}
/** @deprecated */
export const useMyDoctorProfile = useMyProviderProfile

export function useUpdateProviderProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => updateMyProviderProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-provider-profile'] }),
  })
}
/** @deprecated */
export const useUpdateDoctorProfile = useUpdateProviderProfile


// ── Services ──────────────────────────────────────────────────────────────────

export function useMyServicesList() {
  return useQuery({
    queryKey: ['my-services'],
    queryFn:  getMyServices,
    staleTime: 60_000,
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => createService(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-services'] }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateService(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-services'] }),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-services'] }),
  })
}


// ── Working Hours ─────────────────────────────────────────────────────────────

export function useMyWorkingHours(providerId) {
  return useQuery({
    queryKey: ['my-working-hours', providerId],
    queryFn:  () => getMyWorkingHours(providerId),
    staleTime: 60_000,
  })
}
/** @deprecated — alias for backward compat with SchedulePage */
export const useMySchedule = useMyWorkingHours

export function useCreateWorkingHours() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => createWorkingHours(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-working-hours'] }),
  })
}
/** @deprecated */
export const useCreateSchedule = useCreateWorkingHours

export function useUpdateWorkingHours() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateWorkingHours(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-working-hours'] }),
  })
}

export function useDeleteWorkingHours() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteWorkingHours(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-working-hours'] }),
  })
}
/** @deprecated */
export const useDeleteSchedule = useDeleteWorkingHours

export function useBulkUpdateWorkingHours() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ hours, providerId }) => bulkUpdateWorkingHours(hours, providerId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-working-hours'] }),
  })
}


// ── Time Off ──────────────────────────────────────────────────────────────────

export function useMyTimeOffs(params = {}) {
  return useQuery({
    queryKey: ['my-timeoffs', params],
    queryFn:  () => getMyTimeOffs(params),
    staleTime: 60_000,
  })
}
/** @deprecated */
export const useMyExceptions = useMyTimeOffs

export function useCreateTimeOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => createTimeOff(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-timeoffs'] }),
  })
}
/** @deprecated */
export const useCreateException = useCreateTimeOff

export function useDeleteTimeOff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => deleteTimeOff(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-timeoffs'] }),
  })
}
/** @deprecated */
export const useDeleteException = useDeleteTimeOff
