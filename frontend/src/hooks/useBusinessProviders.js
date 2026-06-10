/**
 * hooks/useBusinessProviders.js
 *
 * React Query hooks for the owner-facing Provider Management API.
 * Endpoint base: /api/v1/businesses/me/providers/
 *
 * Design notes:
 *  - All mutations invalidate the 'business-providers' query on success.
 *  - useCreateBusinessProvider / useUpdateBusinessProvider expose `mutateAsync`
 *    so the calling form component can catch field-level errors from the server.
 *  - useDeactivateBusinessProvider exposes `mutate` with callbacks (no form needed).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getBusinessProviders,
  createBusinessProvider,
  updateBusinessProvider,
  deactivateBusinessProvider,
} from '../api/providers'

export const BUSINESS_PROVIDERS_KEY = ['business-providers']

// ── Queries ───────────────────────────────────────────────────────────────────

/**
 * Fetch all providers (active + inactive) for the current user's business.
 * Returns an empty array while loading.
 */
export function useBusinessProviders() {
  return useQuery({
    queryKey: BUSINESS_PROVIDERS_KEY,
    queryFn: getBusinessProviders,
    staleTime: 30_000,
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Create a new provider.
 * Use `mutateAsync` to get Promise-based error propagation for form error handling.
 */
export function useCreateBusinessProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => createBusinessProvider(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BUSINESS_PROVIDERS_KEY }),
  })
}

/**
 * Update an existing provider's fields (specialty, bio, is_active, etc.).
 * Expects `{ providerId, data }` as the mutation variable.
 * Use `mutateAsync` for Promise-based form error handling.
 */
export function useUpdateBusinessProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ providerId, data }) => updateBusinessProvider(providerId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BUSINESS_PROVIDERS_KEY }),
  })
}

/**
 * Soft-delete (deactivate) a provider.
 * Accepts the numeric providerId directly.
 * Use `mutate(id, { onSuccess, onError })` for callback-style usage.
 */
export function useDeactivateBusinessProvider() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (providerId) => deactivateBusinessProvider(providerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BUSINESS_PROVIDERS_KEY }),
  })
}
