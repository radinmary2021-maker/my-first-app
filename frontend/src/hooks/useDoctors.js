import { useQuery } from '@tanstack/react-query'
import { getProviders, getProvider, getProviderSlots, getProviderServices, getMyServices, getBusinessCategories } from '../api/providers'

/** @deprecated use useProviders */
export function useDoctors() { return useProviders() }

export function useProviders(params = {}) {
  return useQuery({
    queryKey: ['providers', params],
    queryFn: () => getProviders(params),
    staleTime: 5 * 60_000,
  })
}

/** @deprecated use useProvider */
export function useDoctor(id) { return useProvider(id) }

export function useProvider(id) {
  return useQuery({
    queryKey: ['provider', id],
    queryFn: () => getProvider(id),
    enabled: Boolean(id),
    staleTime: 5 * 60_000,
  })
}

/** @deprecated use useProviderSlots */
export function useDoctorSlots(id, date, serviceId) { return useProviderSlots(id, date, serviceId) }

export function useProviderSlots(id, date, serviceId) {
  return useQuery({
    queryKey: ['provider-slots', id, date, serviceId],
    queryFn: () => getProviderSlots(id, date, serviceId),
    enabled: Boolean(id) && Boolean(date) && Boolean(serviceId),
    staleTime: 60_000,
  })
}

/** Fetch active services for a specific provider (public). */
export function useProviderServices(id) {
  return useQuery({
    queryKey: ['provider-services', id],
    queryFn:  () => getProviderServices(id),
    enabled:  Boolean(id),
    staleTime: 5 * 60_000,
  })
}

/** Fetch the services offered by a business (uses the authenticated user's business). */
export function useMyServices() {
  return useQuery({
    queryKey: ['my-services'],
    queryFn:  getMyServices,
    staleTime: 5 * 60_000,
  })
}

/**
 * Fetch all available business categories from the API.
 * Returns the full list regardless of whether any providers exist in a category.
 * Each item shape: { value: string, label: string } — falls back gracefully
 * if the API returns a plain string array.
 */
export function useBusinessCategories() {
  return useQuery({
    queryKey: ['business-categories'],
    queryFn:  getBusinessCategories,
    staleTime: 30 * 60_000,
  })
}
