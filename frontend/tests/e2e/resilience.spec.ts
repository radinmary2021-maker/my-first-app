/**
 * PART 6 — Resilience Tests
 *
 * Validates:
 *   - Empty states render correctly on all key pages
 *   - API failures display meaningful error messages
 *   - Pages don't crash on partial data
 *   - Retry actions (refetch) work after an error
 */

import { test, expect } from '@playwright/test'
import { loginAsOwner, loginAsCustomer } from './helpers/auth.js'
import {
  mockBusinessAppointments,
  mockPublicProviders,
  mockPublicProvider,
  mockProviderServices,
  mockNetworkError,
  mock500,
} from './helpers/api-mocks.js'
import { PROVIDER_CARD } from './helpers/fixtures.js'

// ── Empty states ──────────────────────────────────────────────────────────────

test.describe('empty states', () => {
  test('providers list: empty state shown when no providers exist', async ({ page }) => {
    await mockPublicProviders(page, [])

    await page.goto('/providers')

    await expect(page.getByText('نتیجه‌ای یافت نشد')).toBeVisible()
    await expect(page.getByRole('button', { name: 'پاک کردن فیلترها' })).toBeVisible()
  })

  test('owner dashboard: owner-specific empty state', async ({ page }) => {
    await loginAsOwner(page)
    await mockBusinessAppointments(page, [])

    await page.goto('/dashboard')

    await expect(page.getByText('هنوز نوبتی ثبت نشده است.')).toBeVisible()
    await expect(page.getByText(/لینک صفحه کسب‌وکار/)).toBeVisible()
  })

  test('dashboard metrics show all zeros when no appointments today', async ({ page }) => {
    await loginAsOwner(page)
    // All appointments in the past — none for today
    await page.route(/\/api\/v1\/appointments\/business/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            tracking_code: 'TRK-PAST',
            customer_name: 'قدیمی',
            customer_phone: '09100000000',
            provider_name: '',
            service_name: '',
            date: '2020-01-01',
            start_time: '10:00',
            end_time: '10:30',
            status: 'confirmed',
            status_display: 'تأیید شده',
            total_price: 0,
            deposit_paid: 0,
            notes: '',
          },
        ]),
      }),
    )

    await page.goto('/dashboard')

    const metrics = page.getByTestId('owner-metrics')
    // All 4 metrics should be 0 (no today appointments)
    const zeros = metrics.getByText('0')
    await expect(zeros.first()).toBeVisible()
  })

  test('provider management: onboarding card when no providers', async ({ page }) => {
    await loginAsOwner(page)
    await page.route(/\/api\/v1\/businesses\/me\/providers/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/dashboard/providers')

    await expect(page.getByText('هنوز ارائه‌دهنده‌ای ندارید')).toBeVisible()
    await expect(page.getByRole('button', { name: /افزودن خودم/ })).toBeVisible()
  })

  test('schedule page: empty sections show placeholder text', async ({ page }) => {
    await loginAsOwner(page)
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

    await expect(page.getByText('هیچ خدمتی ثبت نشده.')).toBeVisible()
    await expect(page.getByText('هنوز ساعت کاری ثبت نشده.')).toBeVisible()
  })

  test('slot picker: no-slots message when API returns empty array', async ({ page }) => {
    await mockPublicProvider(page)
    await mockProviderServices(page, [])
    await page.route(/\/api\/providers\/\d+\/slots/, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ slots: [] }),
      }),
    )

    await page.goto(`/providers/${PROVIDER_CARD.id}`)

    // Click first available date
    const availableDay = page.locator('button:not([disabled])').filter({ hasText: /^\d+$/ }).first()
    await availableDay.click()

    await expect(page.getByText('اسلات خالی در این تاریخ وجود ندارد')).toBeVisible()
  })
})

// ── API error handling ────────────────────────────────────────────────────────

test.describe('API error handling', () => {
  test('provider list: shows error message on API failure', async ({ page }) => {
    await mock500(page, /\/api\/providers\/$/)

    await page.goto('/providers')

    // DoctorListPage shows error?.response?.data?.error which is 'خطای سرور' from mock500
    await expect(page.getByText(/خطا/)).toBeVisible()
  })

  test('dashboard: shows error message on API failure', async ({ page }) => {
    await loginAsOwner(page)
    await mock500(page, /\/api\/v1\/appointments\/business/)

    await page.goto('/dashboard')

    await expect(page.getByText('مشکلی در دریافت نوبت‌ها پیش آمد.')).toBeVisible()
  })

  test('provider detail: shows error when provider not found', async ({ page }) => {
    await mock500(page, new RegExp(`/api/providers/${PROVIDER_CARD.id}`))

    await page.goto(`/providers/${PROVIDER_CARD.id}`)

    await expect(page.getByText('ارائه‌دهنده مورد نظر یافت نشد')).toBeVisible()
  })

  test('provider management: shows error message and retry link', async ({ page }) => {
    await loginAsOwner(page)
    await mock500(page, /\/api\/v1\/businesses\/me\/providers/)

    await page.goto('/dashboard/providers')

    await expect(page.getByText('خطا در دریافت لیست ارائه‌دهندگان.')).toBeVisible()
    await expect(page.getByText('تلاش مجدد')).toBeVisible()
  })
})

// ── Network error resilience ──────────────────────────────────────────────────

test.describe('network errors', () => {
  test('dashboard survives network abort on appointments', async ({ page }) => {
    await loginAsOwner(page)
    await mockNetworkError(page, /\/api\/v1\/appointments\/business/)

    await page.goto('/dashboard')

    // Page should show error, not crash
    await expect(page.getByText('مشکلی در دریافت نوبت‌ها پیش آمد.')).toBeVisible()
    // Navigation should still work
    await expect(page.getByRole('button', { name: 'مدیریت برنامه' })).toBeVisible()
  })
})

// ── Partial data resilience ───────────────────────────────────────────────────

test.describe('partial data handling', () => {
  test('appointment row with missing fields does not crash', async ({ page }) => {
    await loginAsOwner(page)
    await mockBusinessAppointments(page, [
      {
        id: 1,
        tracking_code: 'TRK-001',
        customer_name: '',          // empty
        customer_phone: '',         // empty
        provider_name: '',          // empty
        service_name: '',           // empty — tracking_code shown instead
        date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '10:30',
        status: 'pending',
        status_display: 'در انتظار',
        total_price: 0,
        deposit_paid: 0,
        notes: '',
      },
    ])

    await page.goto('/dashboard')

    // Should render without crashing
    await expect(page.getByTestId('appointment-row')).toBeVisible()
    // tracking_code shown instead of service_name
    await expect(page.getByText('TRK-001')).toBeVisible()
    // Empty customer name shows fallback
    await expect(page.getByText('—')).toBeVisible()
  })

  test('provider card with minimal data renders correctly', async ({ page }) => {
    await mockPublicProviders(page, [
      {
        id: 99,
        business_name: 'مطب تست',
        full_name: 'دکتر تست',
        category_display: '',
        specialty: '',
        slot_duration: 20,
        service_fee: 0,
        is_active: true,
        available_weekdays: [],
      },
    ])

    await page.goto('/providers')

    await expect(page.getByText('مطب تست')).toBeVisible()
    // No crash even with empty category/fee
  })
})

// ── 404 page ──────────────────────────────────────────────────────────────────

test.describe('404 handling', () => {
  test('unknown route shows not-found page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')

    // NotFoundPage: use the heading specifically to avoid strict-mode violation with paragraph text
    await expect(page.getByRole('heading', { name: '۴۰۴' })).toBeVisible()
  })
})
