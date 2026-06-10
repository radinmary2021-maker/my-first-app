/**
 * PART 2 — Customer Booking Journey
 *
 * Tests:
 *   Public providers page → Provider detail → Select date + slot →
 *   Booking confirmation page → Payment initiation → Payment result page
 *
 * Authentication: customer role injected via localStorage (skip OTP).
 * Payment: mocked to redirect back to our own /payment/result page.
 */

import { test, expect } from '@playwright/test'
import { loginAsCustomer } from './helpers/auth.js'
import {
  mockPublicProviders,
  mockPublicProvider,
  mockProviderSlots,
  mockProviderServices,
  mockCreateAppointment,
  mockInitiatePayment,
} from './helpers/api-mocks.js'
import { PROVIDER_CARD } from './helpers/fixtures.js'

// ── Provider list ─────────────────────────────────────────────────────────────

test.describe('public providers page', () => {
  test('displays provider list', async ({ page }) => {
    await mockPublicProviders(page)

    await page.goto('/providers')

    await expect(page.getByText('کلینیک دکتر احمدی')).toBeVisible()
    await expect(page.getByRole('button', { name: 'رزرو نوبت' })).toBeVisible()
  })

  test('shows empty state when no providers', async ({ page }) => {
    await mockPublicProviders(page, [])

    await page.goto('/providers')

    await expect(page.getByText('نتیجه‌ای یافت نشد')).toBeVisible()
  })

  test('search filters providers', async ({ page }) => {
    await mockPublicProviders(page, [
      { ...PROVIDER_CARD, id: 11, business_name: 'مطب دندانپزشکی' },
      { ...PROVIDER_CARD, id: 12, business_name: 'کلینیک دکتر احمدی' },
    ])

    await page.goto('/providers')

    await page.getByPlaceholder(/جستجو/).fill('دندانپزشکی')

    await expect(page.getByText('مطب دندانپزشکی')).toBeVisible()
    await expect(page.getByText('کلینیک دکتر احمدی')).not.toBeVisible()
  })

  test('clicking رزرو نوبت navigates to provider detail', async ({ page }) => {
    await mockPublicProviders(page)
    await mockPublicProvider(page)
    await mockProviderServices(page, [])
    await mockProviderSlots(page)

    await page.goto('/providers')

    await page.getByRole('button', { name: 'رزرو نوبت' }).first().click()

    await expect(page).toHaveURL(new RegExp(`/providers/${PROVIDER_CARD.id}`))
    await expect(page.getByText('کلینیک دکتر احمدی')).toBeVisible()
  })
})

// ── Provider detail ───────────────────────────────────────────────────────────

test.describe('provider detail page', () => {
  test.beforeEach(async ({ page }) => {
    await mockPublicProvider(page)
    await mockProviderServices(page, []) // no services → date picker shows immediately
  })

  test('shows provider info card', async ({ page }) => {
    await page.goto(`/providers/${PROVIDER_CARD.id}`)

    await expect(page.getByRole('heading', { name: 'کلینیک دکتر احمدی' })).toBeVisible()
    await expect(page.getByText('عمومی')).toBeVisible()
    await expect(page.getByText('فعال')).toBeVisible()
  })

  test('shows date picker with selectable dates', async ({ page }) => {
    await page.goto(`/providers/${PROVIDER_CARD.id}`)

    await expect(page.getByText('انتخاب تاریخ')).toBeVisible()
    // Available day buttons (bg-cyan-50 class) should exist since all weekdays are enabled
    const availableDays = page.locator('button.bg-cyan-50, button[class*="bg-cyan-50"]')
    await expect(availableDays.first()).toBeVisible()
  })

  test('selecting date shows slot picker', async ({ page }) => {
    await mockProviderSlots(page)

    await page.goto(`/providers/${PROVIDER_CARD.id}`)

    // Click first available date
    const availableDay = page.locator('button:not([disabled])').filter({ hasText: /^\d+$/ }).first()
    await availableDay.click()

    await expect(page.getByText('انتخاب ساعت')).toBeVisible()
    await expect(page.getByText('09:00')).toBeVisible()
    await expect(page.getByText('09:30')).toBeVisible()
  })

  test('selecting slot shows proceed button', async ({ page }) => {
    await mockProviderSlots(page)

    await page.goto(`/providers/${PROVIDER_CARD.id}`)

    // Select date
    const availableDay = page.locator('button:not([disabled])').filter({ hasText: /^\d+$/ }).first()
    await availableDay.click()

    // Select slot
    await page.getByText('09:00').click()

    await expect(page.getByRole('button', { name: 'ادامه و رزرو نوبت' })).toBeVisible()
  })

  test('navigates to booking page with slot in state', async ({ page }) => {
    await mockProviderSlots(page)
    await loginAsCustomer(page)

    await page.goto(`/providers/${PROVIDER_CARD.id}`)

    const availableDay = page.locator('button:not([disabled])').filter({ hasText: /^\d+$/ }).first()
    await availableDay.click()
    await page.getByText('09:00').click()
    await page.getByRole('button', { name: 'ادامه و رزرو نوبت' }).click()

    await expect(page).toHaveURL(new RegExp(`/book/${PROVIDER_CARD.id}`))
    await expect(page.getByRole('heading', { name: 'تأیید و پرداخت' })).toBeVisible()
  })
})

// ── Booking confirmation page ─────────────────────────────────────────────────

test.describe('booking confirmation page', () => {
  /**
   * Navigate to /book/:id the proper way (via detail page) so React Router
   * state is passed correctly.  Direct navigation would redirect back to detail.
   */
  async function navigateToBookingPage(page: import('@playwright/test').Page): Promise<void> {
    await mockPublicProvider(page)
    await mockProviderServices(page, [])
    await mockProviderSlots(page)

    await page.goto(`/providers/${PROVIDER_CARD.id}`)

    const availableDay = page.locator('button:not([disabled])').filter({ hasText: /^\d+$/ }).first()
    await availableDay.click()
    await page.getByText('09:00').click()
    await page.getByRole('button', { name: 'ادامه و رزرو نوبت' }).click()

    await expect(page).toHaveURL(new RegExp(`/book/${PROVIDER_CARD.id}`))
  }

  test('shows booking summary with correct details', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToBookingPage(page)

    await expect(page.getByRole('heading', { name: 'تأیید و پرداخت' })).toBeVisible()
    await expect(page.getByText('09:00')).toBeVisible()
    await expect(page.getByText(/تاریخ/)).toBeVisible()
  })

  test('clicking تأیید و پرداخت creates appointment and initiates payment', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToBookingPage(page)

    await mockCreateAppointment(page)
    await mockInitiatePayment(page, 'TRK-NEW-01')

    await page.getByRole('button', { name: 'تأیید و پرداخت' }).click()

    // Appointment created → redirecting state shown
    await expect(page.getByText('در حال اتصال به درگاه پرداخت')).toBeVisible()
    // Then window.location.href = gate_url → our mock redirects to /payment/result
    await expect(page).toHaveURL(/payment\/result/, { timeout: 10_000 })
  })

  test('back button returns to provider detail', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToBookingPage(page)

    await page.getByRole('button', { name: '← بازگشت' }).click()

    await expect(page).toHaveURL(new RegExp(`/providers/${PROVIDER_CARD.id}`))
  })

  test('shows retry button after booking error', async ({ page }) => {
    await loginAsCustomer(page)
    await navigateToBookingPage(page)

    // Mock appointment creation failure
    await page.route(/\/api\/appointments\/$/, (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'این زمان دیگر در دسترس نیست.' }),
      }),
    )

    await page.getByRole('button', { name: 'تأیید و پرداخت' }).click()

    await expect(page.getByText('این زمان دیگر در دسترس نیست')).toBeVisible()
    await expect(page.getByRole('button', { name: 'انتخاب زمان دیگر' })).toBeVisible()
  })
})

// ── Service selection ─────────────────────────────────────────────────────────

test.describe('provider with services', () => {
  test('shows service selection step before date picker', async ({ page }) => {
    await mockPublicProvider(page)
    await mockProviderServices(page, [
      { id: 1, name: 'ویزیت عمومی', duration_minutes: 30, price: 150000, description: '' },
    ])

    await page.goto(`/providers/${PROVIDER_CARD.id}`)

    await expect(page.getByText('۱. انتخاب خدمت')).toBeVisible()
    await expect(page.getByText('ویزیت عمومی')).toBeVisible()
    // Date picker should be hidden until service is selected
    await expect(page.getByText('انتخاب تاریخ')).not.toBeVisible()
  })

  test('selecting service reveals date picker', async ({ page }) => {
    await mockPublicProvider(page)
    await mockProviderServices(page, [
      { id: 1, name: 'ویزیت عمومی', duration_minutes: 30, price: 150000, description: '' },
    ])
    await mockProviderSlots(page)

    await page.goto(`/providers/${PROVIDER_CARD.id}`)

    await page.getByText('ویزیت عمومی').click()

    await expect(page.getByText('۲. انتخاب تاریخ')).toBeVisible()
  })
})
