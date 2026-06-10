/**
 * Phase 9 — Beta Launch E2E Tests
 *
 * Part A: Full owner onboarding journey
 *   Validates the critical path a non-technical business owner takes from
 *   first login to being fully bookable.
 *
 * Part B: Feedback widget
 *   Verifies beta users can surface issues and rate their experience.
 *
 * Part C: Recovery scenarios
 *   Verifies users are never stuck — every error state has a recovery path.
 */

import { test, expect } from '@playwright/test'
import { loginAsOwner } from './helpers/auth.js'
import {
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
  mockFeedback,
  mock500,
} from './helpers/api-mocks.js'
import { OWNER_USER } from './helpers/fixtures.js'

// ── Part A: Full Owner Onboarding Journey ─────────────────────────────────────

test.describe('owner onboarding — full journey', () => {

  test('profile setup navigates to create-business', async ({ page }) => {
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), {
      key: 'auth',
      value: { state: { refreshToken: 'test', user: { id: 4, phone: '09120000004', full_name: '', role: 'customer' } }, version: 0 },
    })
    await mockUpdateProfile(page, { full_name: 'آرایشگر تست', role: 'customer' })
    await mockCategories(page)

    await page.goto('/setup-profile')
    await page.getByLabel('نام و نام خانوادگی').fill('آرایشگر تست')
    await page.getByRole('button', { name: 'ذخیره و ادامه' }).click()
    await expect(page).toHaveURL(/create-business/)
  })

  test('create business page has escape hatch to home for customers', async ({ page }) => {
    await loginAsOwner(page)
    await mockGetCurrentUser(page, OWNER_USER)
    await mockCategories(page)

    await page.goto('/create-business')
    await expect(page.getByText('بازگشت به صفحه اصلی')).toBeVisible()

    await page.getByRole('button', { name: 'بازگشت به صفحه اصلی' }).click()
    await expect(page).toHaveURL('/')
  })

  test('after creating business, dashboard shows onboarding checklist', async ({ page }) => {
    await loginAsOwner(page)
    await mockGetCurrentUser(page, OWNER_USER)
    await mockEmptyBusinessProviders(page)
    await mockBusinessServices(page, [])
    await mockWorkingHours(page, [])
    await mockTimeOffs(page, [])
    await mockBusinessAppointments(page, [])

    await page.goto('/dashboard')
    await expect(page.getByText('راه‌اندازی کسب‌وکار شما')).toBeVisible()
    await expect(page.getByRole('progressbar')).toBeVisible()
  })

  test('onboarding checklist shows "تعریف خدمت" as next step after provider added', async ({ page }) => {
    await loginAsOwner(page)
    await mockGetCurrentUser(page, OWNER_USER)
    await mockBusinessProviders(page)     // has 1 provider
    await mockBusinessServices(page, [])  // no services yet
    await mockWorkingHours(page, [])
    await mockTimeOffs(page, [])
    await mockBusinessAppointments(page, [])

    await page.goto('/dashboard')
    await expect(page.getByText('تعریف خدمت')).toBeVisible()
  })

  test('providers page has solo fast-path button and go-to-schedule CTA', async ({ page }) => {
    await loginAsOwner(page)
    await mockGetCurrentUser(page, OWNER_USER)
    await mockEmptyBusinessProviders(page)
    await mockBusinessServices(page, [])
    await mockWorkingHours(page, [])
    await mockBusinessAppointments(page, [])

    await page.goto('/dashboard/providers')
    await expect(page.getByRole('button', { name: /افزودن خودم/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /برو به تنظیم برنامه/ })).toBeVisible()
  })

  test('schedule page shows Go Live banner when services AND hours are configured', async ({ page }) => {
    await loginAsOwner(page)
    await mockGetCurrentUser(page, OWNER_USER)
    await mockBusinessServices(page)    // has 1 service
    await mockWorkingHours(page)        // has 1 working hours entry
    await mockTimeOffs(page, [])

    await page.goto('/dashboard/schedule')
    await expect(page.getByText('آماده دریافت نوبت هستید!')).toBeVisible()
    await expect(page.getByRole('button', { name: /مشاهده داشبورد/ })).toBeVisible()
  })

  test('schedule page does NOT show Go Live banner when services are missing', async ({ page }) => {
    await loginAsOwner(page)
    await mockGetCurrentUser(page, OWNER_USER)
    await mockBusinessServices(page, [])  // no services
    await mockWorkingHours(page)
    await mockTimeOffs(page, [])

    await page.goto('/dashboard/schedule')
    await expect(page.getByText('آماده دریافت نوبت هستید!')).not.toBeVisible()
  })
})

// ── Part B: Feedback Widget ───────────────────────────────────────────────────

test.describe('feedback widget', () => {

  async function setupOwnerDashboard(page: any) {
    await loginAsOwner(page)
    await mockGetCurrentUser(page, OWNER_USER)
    await mockBusinessProviders(page)
    await mockBusinessServices(page)
    await mockWorkingHours(page)
    await mockTimeOffs(page, [])
    await mockBusinessAppointments(page, [])
  }

  test('feedback trigger button is visible for authenticated users', async ({ page }) => {
    await setupOwnerDashboard(page)
    await page.goto('/dashboard')
    await expect(page.getByRole('button', { name: 'ارسال بازخورد' })).toBeVisible()
  })

  test('clicking the trigger opens the feedback panel', async ({ page }) => {
    await setupOwnerDashboard(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'ارسال بازخورد' }).click()
    await expect(page.getByText('بازخورد شما')).toBeVisible()
    await expect(page.getByText('تجربه شما چطور بود؟')).toBeVisible()
  })

  test('submit is disabled until a rating emoji is selected', async ({ page }) => {
    await setupOwnerDashboard(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'ارسال بازخورد' }).click()
    // The submit button inside the panel (exact: true avoids matching the trigger)
    await expect(page.getByRole('button', { name: 'ارسال بازخورد', exact: true })).toBeDisabled()
  })

  test('selecting rating enables submit button', async ({ page }) => {
    await setupOwnerDashboard(page)
    await mockFeedback(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'ارسال بازخورد' }).click()
    await page.getByTitle('عالی').click()
    await expect(page.getByRole('button', { name: 'ارسال بازخورد', exact: true })).toBeEnabled()
  })

  test('successful submission shows thank-you message', async ({ page }) => {
    await setupOwnerDashboard(page)
    await mockFeedback(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'ارسال بازخورد' }).click()
    await page.getByTitle('عالی').click()
    await page.getByRole('button', { name: 'ارسال بازخورد', exact: true }).click()

    await expect(page.getByText('ممنون از بازخورد شما!')).toBeVisible()
  })

  test('panel closes on Escape key', async ({ page }) => {
    await setupOwnerDashboard(page)
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'ارسال بازخورد' }).click()
    await expect(page.getByText('بازخورد شما')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByText('بازخورد شما')).not.toBeVisible()
  })

  test('feedback degrades gracefully when API returns 500', async ({ page }) => {
    await setupOwnerDashboard(page)
    await mock500(page, '**/api/v1/feedback/')
    await page.goto('/dashboard')

    await page.getByRole('button', { name: 'ارسال بازخورد' }).click()
    await page.getByTitle('عالی').click()
    await page.getByRole('button', { name: 'ارسال بازخورد', exact: true }).click()

    // Falls back to localStorage — still shows success to the user
    await expect(page.getByText('ممنون از بازخورد شما!')).toBeVisible()
  })
})

// ── Part C: Recovery Scenarios ────────────────────────────────────────────────

test.describe('recovery scenarios', () => {

  test('payment failure page shows retry CTA and refund notice', async ({ page }) => {
    await page.goto('/payment/result?status=failed')
    await expect(page.getByText('پرداخت ناموفق')).toBeVisible()
    await expect(page.getByRole('button', { name: 'رزرو نوبت جدید' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'تلاش مجدد' })).toBeVisible()
    await expect(page.getByText(/۷۲ ساعت/)).toBeVisible()
  })

  test('payment success shows both my-appointments and new-booking CTAs', async ({ page }) => {
    await page.goto('/payment/result?status=success&tracking_code=TRK-001')
    await expect(page.getByText('پرداخت موفق')).toBeVisible()
    await expect(page.getByRole('button', { name: 'مشاهده نوبت‌های من' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'رزرو نوبت جدید' })).toBeVisible()
  })

  test('404 page shows two recovery buttons', async ({ page }) => {
    await page.goto('/nonexistent-page')
    await expect(page.getByRole('heading', { name: '۴۰۴' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'برگشت' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'صفحه اصلی' })).toBeVisible()
  })

  test('profile page shows صاحب کسب‌وکار for owner role', async ({ page }) => {
    await loginAsOwner(page)
    await mockGetCurrentUser(page, OWNER_USER)
    await page.goto('/profile')
    await expect(page.getByText('صاحب کسب‌وکار')).toBeVisible()
  })

  test('doctor detail page shows service selection guidance when service required', async ({ page }) => {
    const { mockPublicProvider, mockProviderServices, mockProviderSlots } = await import('./helpers/api-mocks.js')
    await mockPublicProvider(page)
    await mockProviderServices(page, [{ id: 1, name: 'کوتاهی مو', duration_minutes: 30, price: 0 }])
    await mockProviderSlots(page)

    await page.goto('/providers/10')
    // Services shown, none selected yet — guidance should appear
    await expect(page.getByText('کوتاهی مو')).toBeVisible()
    await expect(page.getByText(/ابتدا خدمت مورد نظر را/)).toBeVisible()
  })
})
