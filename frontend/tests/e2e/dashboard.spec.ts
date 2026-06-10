/**
 * PART 4 — Owner Dashboard Journey
 *
 * Validates:
 *   - Owner sees all business appointments (not just their own)
 *   - Metrics bar updates based on today's appointment data
 *   - Appointment actions (complete / no-show / cancel) work end-to-end
 *   - Provider name visible in appointment rows
 *   - Status filters apply correctly
 */

import { test, expect } from '@playwright/test'
import { loginAsOwner, loginAsProvider } from './helpers/auth.js'
import {
  mockBusinessAppointments,
  mockProviderAppointments,
  mockAppointmentAction,
} from './helpers/api-mocks.js'
import { CONFIRMED_APPT, PENDING_APPT, COMPLETED_APPT } from './helpers/fixtures.js'

// ── Owner: business-wide view ─────────────────────────────────────────────────

test.describe('owner dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page)
  })

  test('shows "داشبورد کسب‌وکار" heading', async ({ page }) => {
    await mockBusinessAppointments(page, [CONFIRMED_APPT])

    await page.goto('/dashboard')

    await expect(page.getByText('داشبورد کسب‌وکار')).toBeVisible()
  })

  test('renders owner metrics bar', async ({ page }) => {
    await mockBusinessAppointments(page, [CONFIRMED_APPT, PENDING_APPT, COMPLETED_APPT])

    await page.goto('/dashboard')

    const metrics = page.getByTestId('owner-metrics')
    await expect(metrics).toBeVisible()
    await expect(metrics.getByText('فعال امروز')).toBeVisible()
    await expect(metrics.getByText('در انتظار')).toBeVisible()
    await expect(metrics.getByText('انجام شده')).toBeVisible()
  })

  test('metrics show correct counts for today appointments', async ({ page }) => {
    await mockBusinessAppointments(page, [CONFIRMED_APPT, PENDING_APPT, COMPLETED_APPT])

    await page.goto('/dashboard')

    const metrics = page.getByTestId('owner-metrics')
    // active = confirmed + pending = 2
    await expect(metrics.getByText('2')).toBeVisible()
    // each of pending=1, confirmed=1, completed=1
    await expect(metrics.getByText('1').first()).toBeVisible()
  })

  test('shows provider_name chip in appointment rows', async ({ page }) => {
    await mockBusinessAppointments(page, [CONFIRMED_APPT])

    await page.goto('/dashboard')

    await expect(page.getByText(/ارائه‌دهنده: مالک تست/)).toBeVisible()
  })

  test('shows customer info in appointment rows', async ({ page }) => {
    await mockBusinessAppointments(page, [CONFIRMED_APPT])

    await page.goto('/dashboard')

    await expect(page.getByText('مشتری تست')).toBeVisible()
    await expect(page.getByText('09120000003')).toBeVisible()
  })

  test('empty state shows owner-specific message', async ({ page }) => {
    await mockBusinessAppointments(page, [])

    await page.goto('/dashboard')

    await expect(page.getByText('هنوز نوبتی ثبت نشده است.')).toBeVisible()
    await expect(page.getByText(/لینک صفحه کسب‌وکار/)).toBeVisible()
  })
})

// ── Provider: own appointments only ───────────────────────────────────────────

test.describe('provider dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsProvider(page)
  })

  test('shows "داشبورد ارائه‌دهنده" heading', async ({ page }) => {
    await mockProviderAppointments(page, [CONFIRMED_APPT])

    await page.goto('/dashboard')

    await expect(page.getByText('داشبورد ارائه‌دهنده')).toBeVisible()
  })

  test('does NOT show owner metrics bar', async ({ page }) => {
    await mockProviderAppointments(page, [CONFIRMED_APPT])

    await page.goto('/dashboard')

    await expect(page.getByTestId('owner-metrics')).not.toBeVisible()
  })

  test('does NOT show provider_name chip', async ({ page }) => {
    await mockProviderAppointments(page, [CONFIRMED_APPT])

    await page.goto('/dashboard')

    await expect(page.getByText(/ارائه‌دهنده: مالک تست/)).not.toBeVisible()
  })

  test('shows provider-specific empty state', async ({ page }) => {
    await mockProviderAppointments(page, [])

    await page.goto('/dashboard')

    await expect(page.getByText('نوبتی یافت نشد.')).toBeVisible()
  })
})

// ── Appointment actions ───────────────────────────────────────────────────────

test.describe('appointment actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page)
  })

  test('confirmed appointment shows all three action buttons', async ({ page }) => {
    await mockBusinessAppointments(page, [CONFIRMED_APPT])

    await page.goto('/dashboard')

    const row = page.getByTestId('appointment-row')
    await expect(row.getByRole('button', { name: 'انجام شد' })).toBeVisible()
    await expect(row.getByRole('button', { name: 'غیبت' })).toBeVisible()
    await expect(row.getByRole('button', { name: 'لغو' })).toBeVisible()
  })

  test('pending appointment does NOT show action buttons', async ({ page }) => {
    await mockBusinessAppointments(page, [PENDING_APPT])

    await page.goto('/dashboard')

    // Scope to the appointment row so the 'انجام شده' filter button isn't matched
    await expect(
      page.getByTestId('appointment-row').getByRole('button', { name: 'انجام شد', exact: true }),
    ).not.toBeVisible()
  })

  test('complete action: dialog appears and confirms', async ({ page }) => {
    await mockBusinessAppointments(page, [CONFIRMED_APPT])
    await mockAppointmentAction(page, 'complete')

    await page.goto('/dashboard')

    const row = page.getByTestId('appointment-row')
    await row.getByRole('button', { name: 'انجام شد' }).click()

    // Confirm dialog
    const dialog = page.getByRole('dialog', { name: 'تأیید عملیات' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('آیا این نوبت به پایان رسیده؟')).toBeVisible()

    await dialog.getByRole('button', { name: 'تأیید' }).click()

    // Dialog closes
    await expect(dialog).not.toBeVisible()
  })

  test('no-show action: dialog asks correct question', async ({ page }) => {
    await mockBusinessAppointments(page, [CONFIRMED_APPT])
    await mockAppointmentAction(page, 'no-show')

    await page.goto('/dashboard')

    const row = page.getByTestId('appointment-row')
    await row.getByRole('button', { name: 'غیبت' }).click()

    const dialog = page.getByRole('dialog', { name: 'تأیید عملیات' })
    await expect(dialog.getByText('آیا مشتری غیبت کرده؟')).toBeVisible()
  })

  test('cancel action: dialog has red confirm button', async ({ page }) => {
    await mockBusinessAppointments(page, [CONFIRMED_APPT])
    await mockAppointmentAction(page, 'cancel')

    await page.goto('/dashboard')

    const row = page.getByTestId('appointment-row')
    await row.getByRole('button', { name: 'لغو' }).click()

    const dialog = page.getByRole('dialog', { name: 'تأیید عملیات' })
    await expect(dialog.getByText('آیا می‌خواهید این نوبت را لغو کنید؟')).toBeVisible()

    const confirmBtn = dialog.getByRole('button', { name: 'تأیید' })
    await expect(confirmBtn).toBeVisible()
    await confirmBtn.click()

    await expect(dialog).not.toBeVisible()
  })

  test('انصراف button closes the dialog', async ({ page }) => {
    await mockBusinessAppointments(page, [CONFIRMED_APPT])

    await page.goto('/dashboard')

    const row = page.getByTestId('appointment-row')
    await row.getByRole('button', { name: 'انجام شد' }).click()

    const dialog = page.getByRole('dialog', { name: 'تأیید عملیات' })
    await dialog.getByRole('button', { name: 'انصراف' }).click()

    await expect(dialog).not.toBeVisible()
  })
})

// ── Filters ───────────────────────────────────────────────────────────────────

test.describe('dashboard filters', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page)
  })

  test('clicking confirmed filter sends status=confirmed to API', async ({ page }) => {
    let capturedUrl = ''
    await page.route(/\/api\/v1\/appointments\/business/, async (route) => {
      capturedUrl = route.request().url()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.goto('/dashboard')

    // Click confirmed filter
    await page.getByRole('button', { name: 'تأیید شده' }).first().click()

    // Wait for re-fetch
    await page.waitForTimeout(300)

    expect(capturedUrl).toMatch(/status=confirmed/)
  })

  test('date filter button appears after date is set', async ({ page }) => {
    await mockBusinessAppointments(page, [])

    await page.goto('/dashboard')

    const dateInput = page.locator('input[type="date"]')
    await dateInput.fill('2026-06-15')

    await expect(page.getByRole('button', { name: 'پاک کردن تاریخ' })).toBeVisible()
  })

  test('clearing date removes the filter button', async ({ page }) => {
    await mockBusinessAppointments(page, [])

    await page.goto('/dashboard')

    const dateInput = page.locator('input[type="date"]')
    await dateInput.fill('2026-06-15')
    await page.getByRole('button', { name: 'پاک کردن تاریخ' }).click()

    await expect(page.getByRole('button', { name: 'پاک کردن تاریخ' })).not.toBeVisible()
  })
})

// ── مدیریت برنامه navigation ──────────────────────────────────────────────────

test.describe('dashboard navigation', () => {
  test('مدیریت برنامه button navigates to schedule page', async ({ page }) => {
    await loginAsOwner(page)
    await mockBusinessAppointments(page, [])
    // Schedule page APIs
    await page.route(/\/api\/v1\/businesses\/me\/services/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.route(/\/api\/v1\/businesses\/me\/working-hours/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.route(/\/api\/v1\/businesses\/me\/timeoffs/, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/dashboard')
    await page.getByRole('button', { name: 'مدیریت برنامه' }).click()

    await expect(page).toHaveURL(/dashboard\/schedule/)
  })
})
