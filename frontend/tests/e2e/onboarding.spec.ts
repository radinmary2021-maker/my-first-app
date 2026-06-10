/**
 * PART 1 — Owner Onboarding Journey
 *
 * Tests the complete new-business-owner onboarding path:
 *   Register via OTP → Profile Setup → Create Business →
 *   Add Self as Provider → Create Service → Configure Working Hours →
 *   Access Dashboard
 *
 * All backend calls are mocked; no live server required.
 */

import { test, expect } from '@playwright/test'
import { fillOtp } from './helpers/auth.js'
import {
  mockSendOtp,
  mockVerifyOtp,
  mockUpdateProfile,
  mockGetCurrentUser,
  mockCategories,
  mockCreateBusiness,
  mockEmptyBusinessProviders,
  mockBusinessProviders,
  mockBusinessServices,
  mockWorkingHours,
  mockTimeOffs,
  mockBusinessAppointments,
  mockProviderAppointments,
} from './helpers/api-mocks.js'

// ── 1. OTP Login ──────────────────────────────────────────────────────────────

test.describe('OTP authentication', () => {
  test('sends OTP and navigates to verify page', async ({ page }) => {
    await mockSendOtp(page)

    await page.goto('/login')
    await expect(page.getByText('ورود به سیستم')).toBeVisible()

    await page.getByRole('textbox').fill('09120000001')
    await page.getByRole('button', { name: 'ارسال کد تأیید' }).click()

    await expect(page).toHaveURL(/verify-otp/)
    await expect(page.getByText('کد تأیید')).toBeVisible()
  })

  test('invalid phone format shows inline error', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('textbox').fill('1234')
    await page.getByRole('button', { name: 'ارسال کد تأیید' }).click()

    await expect(page.getByText(/شماره موبایل معتبر/)).toBeVisible()
    // Should NOT navigate
    await expect(page).toHaveURL(/login/)
  })

  test('verify OTP and redirects new user away from login', async ({ page }) => {
    await mockSendOtp(page)
    // customer with no full_name: app routes customers to /providers
    await mockVerifyOtp(page, { full_name: '', role: 'customer' }, false)
    await page.route(/\/api\/providers\//, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/login')
    await page.getByRole('textbox').fill('09120000004')
    await page.getByRole('button', { name: 'ارسال کد تأیید' }).click()

    await expect(page).toHaveURL(/verify-otp/)
    await fillOtp(page)
    await page.getByRole('button', { name: 'ورود' }).click()

    // Customer role is redirected to /providers (not /setup-profile) by the app router
    await expect(page).toHaveURL(/providers/)
    await expect(page).not.toHaveURL(/login/)
  })

  test('verify OTP and redirects returning owner to dashboard', async ({ page }) => {
    await mockSendOtp(page)
    await mockVerifyOtp(page, { full_name: 'مالک تست', role: 'owner' }, true)
    // Dashboard queries
    await mockBusinessAppointments(page)

    await page.goto('/login')
    await page.getByRole('textbox').fill('09120000001')
    await page.getByRole('button', { name: 'ارسال کد تأیید' }).click()

    await fillOtp(page)
    await page.getByRole('button', { name: 'ورود' }).click()

    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByText('داشبورد کسب‌وکار')).toBeVisible()
  })
})

// ── 2. Profile Setup ──────────────────────────────────────────────────────────

test.describe('profile setup', () => {
  test('saves name and navigates to create-business', async ({ page }) => {
    // Inject an auth state with no name (triggers setup-profile page guard)
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: 'auth',
      value: {
        state: {
          refreshToken: 'test-refresh',
          user: { id: 4, phone: '09120000004', full_name: '', role: 'customer' },
        },
        version: 0,
      },
    })
    await mockUpdateProfile(page, { full_name: 'مالک تست', role: 'customer' })
    await mockCategories(page)

    await page.goto('/setup-profile')
    await expect(page.getByText('تکمیل پروفایل')).toBeVisible()

    await page.getByLabel('نام و نام خانوادگی').fill('مالک تست')
    await page.getByRole('button', { name: 'ذخیره و ادامه' }).click()

    await expect(page).toHaveURL(/create-business/)
  })

  test('shows validation error for name < 2 chars', async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: 'auth',
      value: {
        state: {
          refreshToken: 'test-refresh',
          user: { id: 4, phone: '09120000004', full_name: '', role: 'customer' },
        },
        version: 0,
      },
    })

    await page.goto('/setup-profile')
    await page.getByLabel('نام و نام خانوادگی').fill('ا')
    await page.getByRole('button', { name: 'ذخیره و ادامه' }).click()

    await expect(page.getByText(/حداقل ۲ کاراکتر/)).toBeVisible()
    await expect(page).toHaveURL(/setup-profile/)
  })
})

// ── 3. Create Business ────────────────────────────────────────────────────────

test.describe('business creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: 'auth',
      value: {
        state: {
          refreshToken: 'test-refresh',
          user: { id: 1, phone: '09120000001', full_name: 'مالک تست', role: 'customer' },
        },
        version: 0,
      },
    })
  })

  test('creates a business and navigates to dashboard', async ({ page }) => {
    await mockCategories(page)
    await mockCreateBusiness(page)
    await mockGetCurrentUser(page) // returns user with role='owner'
    await mockBusinessAppointments(page)

    await page.goto('/create-business')
    await expect(page.getByRole('heading', { name: 'ایجاد کسب‌وکار' })).toBeVisible()

    await page.getByLabel(/نام کسب‌وکار/).fill('کلینیک تست')
    await page.getByRole('button', { name: 'ایجاد کسب‌وکار' }).click()

    await expect(page).toHaveURL(/dashboard/)
    await expect(page.getByText('داشبورد کسب‌وکار')).toBeVisible()
  })

  test('submit button disabled when name is empty', async ({ page }) => {
    await mockCategories(page)
    await page.goto('/create-business')

    const btn = page.getByRole('button', { name: 'ایجاد کسب‌وکار' })
    await expect(btn).toBeDisabled()
  })
})

// ── 4. Add Self as Provider (solo fast-path) ──────────────────────────────────

test.describe('solo provider fast-path', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: 'auth',
      value: {
        state: {
          refreshToken: 'test-refresh',
          user: { id: 1, phone: '09120000001', full_name: 'مالک تست', role: 'owner' },
        },
        version: 0,
      },
    })
  })

  test('shows onboarding card when no providers exist', async ({ page }) => {
    await mockEmptyBusinessProviders(page)

    await page.goto('/dashboard/providers')
    await expect(page.getByText('هنوز ارائه‌دهنده‌ای ندارید')).toBeVisible()
    await expect(page.getByRole('button', { name: /افزودن خودم/ })).toBeVisible()
  })

  test('clicking افزودن خودم navigates to schedule page', async ({ page }) => {
    // Register empty list ONLY — do NOT register a second mockBusinessProviders
    // because Playwright routes are LIFO and the second one would override the first,
    // hiding the onboarding card that contains the button.
    await mockEmptyBusinessProviders(page)
    // Schedule page APIs needed after navigation
    await mockBusinessServices(page, [])
    await mockWorkingHours(page, [])
    await mockTimeOffs(page, [])

    await page.goto('/dashboard/providers')
    await page.getByRole('button', { name: /افزودن خودم/ }).click()

    await expect(page).toHaveURL(/dashboard\/schedule/)
    await expect(page.getByText('خدمات')).toBeVisible()
  })
})

// ── 5. Create Service ─────────────────────────────────────────────────────────

test.describe('service creation on schedule page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: 'auth',
      value: {
        state: {
          refreshToken: 'test-refresh',
          user: { id: 1, phone: '09120000001', full_name: 'مالک تست', role: 'owner' },
        },
        version: 0,
      },
    })
  })

  test('adds a service and shows it in the list', async ({ page }) => {
    await mockBusinessServices(page, [])
    await mockWorkingHours(page, [])
    await mockTimeOffs(page, [])

    await page.goto('/dashboard/schedule')

    // Fill service form
    await page.getByPlaceholder('مثلاً: ویزیت، کوتاهی مو، مشاوره').fill('ویزیت عمومی')

    // After submit, the mock returns SERVICE in the list
    await mockBusinessServices(page, [{ id: 1, name: 'ویزیت عمومی', duration_minutes: 30, buffer_minutes: 0, price: 0, is_active: true }])

    await page.getByRole('button', { name: 'افزودن خدمت' }).click()

    await expect(page.getByText('ویزیت عمومی').first()).toBeVisible()
  })
})

// ── 6. Configure Working Hours ────────────────────────────────────────────────

test.describe('working hours configuration', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: 'auth',
      value: {
        state: {
          refreshToken: 'test-refresh',
          user: { id: 1, phone: '09120000001', full_name: 'مالک تست', role: 'owner' },
        },
        version: 0,
      },
    })
  })

  test('shows schedule page with sections', async ({ page }) => {
    await mockBusinessServices(page, [])
    await mockWorkingHours(page, [])
    await mockTimeOffs(page, [])

    await page.goto('/dashboard/schedule')

    await expect(page.getByText('خدمات')).toBeVisible()
    await expect(page.getByText('ساعات کاری هفتگی')).toBeVisible()
  })

  test('adds working hours', async ({ page }) => {
    await mockBusinessServices(page, [])
    await mockWorkingHours(page, [])
    await mockTimeOffs(page, [])

    await page.goto('/dashboard/schedule')

    // Fill hours form — start/end time inputs inside the working hours form
    const hoursForm = page.locator('section').filter({ hasText: 'ساعات کاری هفتگی' })
    const timeInputs = hoursForm.locator('input[type="time"]')
    await timeInputs.first().fill('09:00')
    await timeInputs.last().fill('17:00')

    // After submit, mock returns the hours
    await mockWorkingHours(page, [{ id: 1, weekday: 0, start_time: '09:00', end_time: '17:00' }])

    await hoursForm.getByRole('button', { name: 'افزودن' }).click()

    await expect(page.getByText(/09:00/).first()).toBeVisible()
  })
})

// ── 7. Access Dashboard After Full Onboarding ─────────────────────────────────

test.describe('dashboard access after onboarding', () => {
  test('owner can reach dashboard after full setup', async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: 'auth',
      value: {
        state: {
          refreshToken: 'test-refresh',
          user: { id: 1, phone: '09120000001', full_name: 'مالک تست', role: 'owner' },
        },
        version: 0,
      },
    })
    await mockBusinessAppointments(page)

    await page.goto('/dashboard')

    await expect(page.getByText('داشبورد کسب‌وکار')).toBeVisible()
    await expect(page.getByRole('button', { name: 'مدیریت برنامه' })).toBeVisible()
  })

  test('providers navigation link is visible for owners', async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: 'auth',
      value: {
        state: {
          refreshToken: 'test-refresh',
          user: { id: 1, phone: '09120000001', full_name: 'مالک تست', role: 'owner' },
        },
        version: 0,
      },
    })
    await mockBusinessAppointments(page)

    await page.goto('/dashboard')

    // Navigation should show the /dashboard/providers link (distinct from the public /providers link)
    await expect(page.locator('a[href="/dashboard/providers"]')).toBeVisible()
  })
})
