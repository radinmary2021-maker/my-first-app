/**
 * utils/roles.js
 *
 * Role utilities for the Nobatic frontend.
 *
 * Backend UserRole enum (apps/accounts/models.py):
 *   customer  — end-user booking appointments
 *   owner     — business owner (created via BusinessService.create_business)
 *   provider  — LEGACY / backward-compat only (old accounts before SaaS refactor)
 *   admin     — system administrator (uses Django admin panel)
 *
 * IMPORTANT: Do NOT add role checks inline across components.
 * Always import from here so future role changes are a single-file edit.
 */

/**
 * Roles that grant access to the business management dashboard.
 * Includes legacy 'provider' role for backward compatibility.
 */
export const BUSINESS_ROLES = ['owner', 'provider']

/**
 * Returns true if the given role has access to the provider/business dashboard.
 * Handles both the current 'owner' role and the legacy 'provider' role.
 *
 * @param {string|null|undefined} role
 * @returns {boolean}
 */
export function isBusinessUser(role) {
  return BUSINESS_ROLES.includes(role)
}

/**
 * Returns true if the user is a pure customer (no business access).
 *
 * @param {string|null|undefined} role
 * @returns {boolean}
 */
export function isCustomer(role) {
  return role === 'customer'
}
