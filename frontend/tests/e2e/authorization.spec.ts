/**
 * PART 5 — Authorization Journeys
 *
 * Validates route guards:
 *   - Unauthenticated users are redirected to /login from protected routes
 *   - Customer role is redirected to /providers from doctor/owner routes
 *   - Owner and provider roles can access dashboard routes
 *   - Public routes are accessible by everyone
 */

import { test, expect } from '@playwright/test'
import { loginAsOwner, loginAsProvider, loginAsCustomer } from './helpers/auth.js'
import { mockBusinessAppointments, mockProviderAppointments } from './helpers/api-mocks.js'

// ── Unauthenticated users ─────────────────────────────────────────────────────

test.describe('unauthenticated user redirects', () => {
  test('accessing /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/login/)
    await expect(page.getByText('ورود به سیستم')).toBeVisible()
  })

  test('accessing /dashboard/schedule redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/schedule')

    await expect(page).toHaveURL(/login/)
  })

  test('accessing /dashboard/providers redirects to /login', async ({ page }) => {
    await page.goto('/dashboard/providers')

    await expect(page).toHaveURL(/login/)
  })

  test('accessing /my-appointments redirects to /login', async ({ page }) => {
    await page.goto('/my-appointments')

    await expect(page).toHaveURL(/login/)
  })

  test('accessing /profile redirects to /login', async ({ page }) => {
    await page.goto('/profile')

    await expect(page).toHaveURL(/login/)
  })

  test('public routes are accessible without auth', async ({ page }) => {
    await page.route(/\/api\/providers\//, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/providers')

    // Should NOT redirect to login
    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByText('لیست ارائه‌دهندگان')).toBeVisible()
  })

  test('home page is accessible without auth', async ({ page }) => {
    await page.goto('/')

    await expect(page).not.toHaveURL(/login/)
  })
})

// ── Customer role ─────────────────────────────────────────────────────────────

test.describe('customer role access control', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsCustomer(page)
  })

  test('accessing /dashboard redirects customer to /providers', async ({ page }) => {
    await page.route(/\/api\/providers\//, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/dashboard')

    await expect(page).toHaveURL(/providers/)
    // Should NOT show the dashboard page
    await expect(page.getByText('داشبورد کسب‌وکار')).not.toBeVisible()
  })

  test('customer can access /providers', async ({ page }) => {
    await page.route(/\/api\/providers\//, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/providers')

    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByText('لیست ارائه‌دهندگان')).toBeVisible()
  })

  test('customer can access /my-appointments', async ({ page }) => {
    await page.route(/\/api\/appointments\/mine/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/my-appointments')

    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByRole('heading', { name: 'نوبت‌های من' })).toBeVisible()
  })
})

// ── Owner role ────────────────────────────────────────────────────────────────

test.describe('owner role access control', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page)
  })

  test('owner can access /dashboard', async ({ page }) => {
    await mockBusinessAppointments(page)

    await page.goto('/dashboard')

    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByText('داشبورد کسب‌وکار')).toBeVisible()
  })

  test('owner can access /dashboard/schedule', async ({ page }) => {
    await page.route(/\/api\/v1\/businesses\/me\/services/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.route(/\/api\/v1\/businesses\/me\/working-hours/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.route(/\/api\/v1\/businesses\/me\/timeoffs/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/dashboard/schedule')

    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByText('خدمات')).toBeVisible()
  })

  test('owner can access /dashboard/providers', async ({ page }) => {
    await page.route(/\/api\/v1\/businesses\/me\/providers/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/dashboard/providers')

    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByRole('heading', { name: 'ارائه‌دهندگان' })).toBeVisible()
  })
})

// ── Provider role ─────────────────────────────────────────────────────────────

test.describe('provider role access control', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProvider(page)
  })

  test('provider can access /dashboard', async ({ page }) => {
    await mockProviderAppointments(page)

    await page.goto('/dashboard')

    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByText('داشبورد ارائه‌دهنده')).toBeVisible()
  })

  test('provider can access /dashboard/schedule', async ({ page }) => {
    await page.route(/\/api\/v1\/businesses\/me\/services/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.route(/\/api\/v1\/businesses\/me\/working-hours/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.route(/\/api\/v1\/businesses\/me\/timeoffs/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/dashboard/schedule')

    await expect(page).not.toHaveURL(/login/)
    await expect(page.getByText('خدمات')).toBeVisible()
  })
})

// ── GuestRoute guard ──────────────────────────────────────────────────────────

test.describe('guest-only routes', () => {
  test('authenticated user is redirected away from /login', async ({ page }) => {
    await loginAsOwner(page)
    await mockBusinessAppointments(page)

    await page.goto('/login')

    // GuestRoute redirects authenticated users to their role-appropriate page
    await expect(page).not.toHaveURL(/login/)
  })

  test('authenticated user is redirected away from /verify-otp', async ({ page }) => {
    await loginAsOwner(page)
    await mockBusinessAppointments(page)

    await page.goto('/verify-otp')

    await expect(page).not.toHaveURL(/verify-otp/)
  })
})
