/**
 * Auth injection helpers for E2E tests.
 *
 * Pattern: inject Zustand persist state into localStorage BEFORE page.goto()
 * so the store hydrates with the right user on the very first render.
 *
 * Zustand persist storage format (name: 'auth'):
 *   { state: { refreshToken, user }, version: 0 }
 *
 * Note: accessToken is NOT persisted (partialize excludes it). That's fine — all
 * API calls are mocked so 401 → refresh flow never triggers.
 */

import { type Page } from '@playwright/test'

interface User {
  id: number
  phone: string
  full_name: string
  role: 'owner' | 'provider' | 'customer'
}

/**
 * Register an init script that sets Zustand auth state BEFORE the page loads.
 * Call this BEFORE page.goto().
 */
export async function injectAuth(
  page: Page,
  user: User,
  refreshToken = 'test-refresh-token',
): Promise<void> {
  await page.addInitScript(
    ({ key, value }) => {
      // This runs in the browser BEFORE any page script
      localStorage.setItem(key, JSON.stringify(value))
    },
    {
      key: 'auth',
      value: {
        state: { refreshToken, user },
        version: 0,
      },
    },
  )
}

/**
 * Convenience wrappers for each role.
 */
export async function loginAsOwner(page: Page, overrides: Partial<User> = {}): Promise<void> {
  await injectAuth(page, {
    id: 1,
    phone: '09120000001',
    full_name: 'مالک تست',
    role: 'owner',
    ...overrides,
  })
}

export async function loginAsProvider(page: Page, overrides: Partial<User> = {}): Promise<void> {
  await injectAuth(page, {
    id: 2,
    phone: '09120000002',
    full_name: 'ارائه‌دهنده تست',
    role: 'provider',
    ...overrides,
  })
}

export async function loginAsCustomer(page: Page, overrides: Partial<User> = {}): Promise<void> {
  await injectAuth(page, {
    id: 3,
    phone: '09120000003',
    full_name: 'مشتری تست',
    role: 'customer',
    ...overrides,
  })
}

/**
 * Fill the OTP form with 6 digits. Handles the digit-box UI.
 */
export async function fillOtp(page: Page, otp = '123456'): Promise<void> {
  const inputs = page.locator('input[inputmode="numeric"]')
  for (let i = 0; i < 6; i++) {
    await inputs.nth(i).fill(otp[i])
  }
}
