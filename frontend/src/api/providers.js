/**
 * api/providers.js
 *
 * All API calls for the providers domain — two sub-domains:
 *
 *  1. Public / customer-facing  →  /api/providers/...
 *  2. Business management       →  /api/v1/businesses/me/...  (staff/owner only)
 */
import client from './client'

// ── Public: provider discovery ────────────────────────────────────────────────

export function getProviders(params = {}) {
  return client.get('/api/providers/', { params }).then((r) => r.data)
}

export function getProvider(id) {
  return client.get(`/api/providers/${id}/`).then((r) => r.data)
}

/**
 * Returns active services offered by a provider's business.
 * Public — no authentication required.
 */
export function getProviderServices(id) {
  return client.get(`/api/providers/${id}/services/`).then((r) => r.data)
}

/**
 * Returns available slot times for a provider on a given date.
 * serviceId is required — the backend uses it to determine slot duration.
 */
export function getProviderSlots(id, date, serviceId) {
  if (!serviceId) throw new Error('serviceId is required to fetch slots')
  return client
    .get(`/api/providers/${id}/slots/`, { params: { date, service_id: serviceId } })
    .then((r) => r.data)
}

export function getBusinessCategories() {
  return client.get('/api/providers/categories/').then((r) => r.data)
}

// ── Business staff: own profile ───────────────────────────────────────────────

export function getMyProviderProfile() {
  return client.get('/api/providers/me/').then((r) => r.data)
}

export function updateMyProviderProfile(data) {
  return client.patch('/api/providers/me/', data).then((r) => r.data)
}

// ── Business management: services ────────────────────────────────────────────

export function getMyServices(includeInactive = false) {
  const params = includeInactive ? { include_inactive: 'true' } : {}
  return client.get('/api/v1/businesses/me/services/', { params }).then((r) => r.data)
}

export function createService(data) {
  return client.post('/api/v1/businesses/me/services/', data).then((r) => r.data)
}

export function updateService(id, data) {
  return client.patch(`/api/v1/businesses/me/services/${id}/`, data).then((r) => r.data)
}

export function deleteService(id) {
  return client.delete(`/api/v1/businesses/me/services/${id}/`).then((r) => r.data)
}

// ── Business management: working hours ───────────────────────────────────────

export function getMyWorkingHours(providerId) {
  const params = providerId ? { provider_id: providerId } : {}
  return client.get('/api/v1/businesses/me/working-hours/', { params }).then((r) => r.data)
}

export function createWorkingHours(data) {
  return client.post('/api/v1/businesses/me/working-hours/', data).then((r) => r.data)
}

export function updateWorkingHours(id, data) {
  return client.patch(`/api/v1/businesses/me/working-hours/${id}/`, data).then((r) => r.data)
}

export function deleteWorkingHours(id) {
  return client.delete(`/api/v1/businesses/me/working-hours/${id}/`).then((r) => r.data)
}

/**
 * Bulk-upsert a full week's schedule.
 * hours = [{ weekday, start_time, end_time, is_active }]
 */
export function bulkUpdateWorkingHours(hours, providerId) {
  const payload = { hours }
  if (providerId) payload.provider_id = providerId
  return client.put('/api/v1/businesses/me/working-hours/bulk/', payload).then((r) => r.data)
}

// ── Business management: time off ─────────────────────────────────────────────

export function getMyTimeOffs(params = {}) {
  return client.get('/api/v1/businesses/me/timeoffs/', { params }).then((r) => r.data)
}

export function createTimeOff(data) {
  return client.post('/api/v1/businesses/me/timeoffs/', data).then((r) => r.data)
}

export function deleteTimeOff(id) {
  return client.delete(`/api/v1/businesses/me/timeoffs/${id}/`).then((r) => r.data)
}

// ── Business management: providers ───────────────────────────────────────────

/** Returns all providers (active + inactive) for the authenticated user's business. */
export function getBusinessProviders() {
  return client.get('/api/v1/businesses/me/providers/').then((r) => r.data)
}

/** Add a new provider to the business. Requires owner role. */
export function createBusinessProvider(data) {
  return client.post('/api/v1/businesses/me/providers/', data).then((r) => r.data)
}

/** Partial-update a provider's profile fields. Requires owner role. */
export function updateBusinessProvider(providerId, data) {
  return client.patch(`/api/v1/businesses/me/providers/${providerId}/`, data).then((r) => r.data)
}

/**
 * Soft-delete (deactivate) a provider. Requires owner role.
 * Returns 204 No Content — no body to parse.
 */
export function deactivateBusinessProvider(providerId) {
  return client.delete(`/api/v1/businesses/me/providers/${providerId}/`)
}

// ── Provider services (per-provider) ─────────────────────────────────────────

export function getProviderOwnServices(providerId) {
  return client.get(`/api/v1/businesses/me/providers/${providerId}/services/`).then((r) => r.data)
}

export function createProviderOwnService(providerId, data) {
  return client.post(`/api/v1/businesses/me/providers/${providerId}/services/`, data).then((r) => r.data)
}

export function updateProviderOwnService(providerId, serviceId, data) {
  return client.patch(`/api/v1/businesses/me/providers/${providerId}/services/${serviceId}/`, data).then((r) => r.data)
}

export function deleteProviderOwnService(providerId, serviceId) {
  return client.delete(`/api/v1/businesses/me/providers/${providerId}/services/${serviceId}/`)
}

// ── Business CRUD (owner only) ────────────────────────────────────────────────

/**
 * Create a new business for the authenticated user.
 * Elevates the user's role to 'owner' on the backend.
 * Callers MUST refresh the auth store after this succeeds:
 *   getCurrentUser().then(res => setUser(res.data))
 */
export function createMyBusiness(data) {
  return client.post('/api/v1/businesses/', data).then((r) => r.data)
}

/**
 * Retrieve the authenticated user's current business.
 * Returns 403 / context error if the user has no business membership.
 */
// ── Reviews ──────────────────────────────────────────────────────────────────

export function submitReview(appointmentId, data) {
  return client.post(`/api/appointments/${appointmentId}/review/`, data).then((r) => r.data)
}

export function getProviderReviews(providerId, page = 1) {
  return client.get(`/api/providers/${providerId}/reviews/`, { params: { page } }).then((r) => r.data)
}

export function getMyBusiness() {
  return client.get('/api/v1/businesses/me/').then((r) => r.data)
}

/**
 * Partial update of the authenticated user's business profile.
 */
export function updateMyBusiness(data) {
  return client.patch('/api/v1/businesses/me/', data).then((r) => r.data)
}

// ── Availability (used by BookAppointmentPage) ────────────────────────────────

/**
 * Get available slots for a date.
 * Uses the new scheduling engine (service-aware, buffer-aware).
 * businessId is the provider's business.
 */
export function getAvailability({ businessId, date, serviceId, providerId }) {
  return client
    .get('/api/v1/businesses/me/availability/', {
      params: {
        date,
        service_id:  serviceId,
        provider_id: providerId,
        business_id: businessId,
      },
    })
    .then((r) => r.data)
}
