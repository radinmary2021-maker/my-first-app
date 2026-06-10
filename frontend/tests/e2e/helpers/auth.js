/**
 * Auth injection helpers for E2E tests.
 *
 * Pattern: inject Zustand persist state into localStorage BEFORE page.goto()
 * so the store hydrates with the right user on the very first render.
 *
 * Zustand persist storage format (name: 'auth'):
 *   { state: { refreshToken, user }, version: 0 }
 */

/**
 * Register an init script that sets Zustand auth state BEFORE the page loads.
 * Call this BEFORE page.goto().
 * @param {import('@playwright/test').Page} page
 * @param {object} user
 * @param {string} [refreshToken]
 */
export async function injectAuth(page, user, refreshToken = 'test-refresh-token') {
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

/** @param {import('@playwright/test').Page} page */
export async function loginAsOwner(page, overrides = {}) {
  await injectAuth(page, {
    id: 1,
    phone: '09120000001',
    full_name: 'مالک تست',
    role: 'owner',
    ...overrides,
  })
}

/** @param {import('@playwright/test').Page} page */
export async function loginAsProvider(page, overrides = {}) {
  await injectAuth(page, {
    id: 2,
    phone: '09120000002',
    full_name: 'ارائه‌دهنده تست',
    role: 'provider',
    ...overrides,
  })
}

/** @param {import('@playwright/test').Page} page */
export async function loginAsCustomer(page, overrides = {}) {
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
 * @param {import('@playwright/test').Page} page
 * @param {string} [otp]
 */
export async function fillOtp(page, otp = '123456') {
  const inputs = page.locator('input[inputmode="numeric"]')
  for (let i = 0; i < 6; i++) {
    await inputs.nth(i).fill(otp[i])
  }
}
