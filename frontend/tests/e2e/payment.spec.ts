/**
 * PART 3 — Payment Callback Journey
 *
 * Validates the /payment/result page — which Zarinpal redirects to after
 * the user completes (or cancels) payment.
 *
 * The page reads URL search params: ?status=success|failed&tracking_code=&ref_id=
 * No authentication required (payment redirect can come to anonymous users).
 * No API calls are made on this page — it's purely UI logic.
 */

import { test, expect } from '@playwright/test'

// ── Successful payment ────────────────────────────────────────────────────────

test.describe('successful payment result', () => {
  test('shows success UI and tracking code', async ({ page }) => {
    await page.goto('/payment/result?status=success&tracking_code=TRK-001&ref_id=REF-123456')

    await expect(page.getByText('پرداخت موفق')).toBeVisible()
    await expect(page.getByText('نوبت شما با موفقیت ثبت شد')).toBeVisible()
    await expect(page.getByText('TRK-001')).toBeVisible()
    await expect(page.getByText('REF-123456')).toBeVisible()
  })

  test('shows tracking code and reference id in card', async ({ page }) => {
    await page.goto('/payment/result?status=success&tracking_code=TRK-XYZ&ref_id=12345')

    // Success icon (green checkmark)
    await expect(page.locator('.bg-green-100')).toBeVisible()

    await expect(page.getByText('کد پیگیری')).toBeVisible()
    await expect(page.getByText('TRK-XYZ')).toBeVisible()
    await expect(page.getByText('شماره مرجع')).toBeVisible()
  })

  test('shows tracking code only (no ref_id)', async ({ page }) => {
    await page.goto('/payment/result?status=success&tracking_code=TRK-ONLY')

    await expect(page.getByText('پرداخت موفق')).toBeVisible()
    await expect(page.getByText('TRK-ONLY')).toBeVisible()
    // ref_id section should not render
    await expect(page.getByText('شماره مرجع')).not.toBeVisible()
  })

  test('رزرو نوبت جدید button navigates to /providers', async ({ page }) => {
    await page.goto('/payment/result?status=success&tracking_code=TRK-001')

    await page.getByRole('button', { name: 'رزرو نوبت جدید' }).click()

    await expect(page).toHaveURL(/providers/)
  })
})

// ── Failed payment ────────────────────────────────────────────────────────────

test.describe('failed payment result', () => {
  test('shows failure UI when status=failed', async ({ page }) => {
    await page.goto('/payment/result?status=failed')

    await expect(page.getByText('پرداخت ناموفق')).toBeVisible()
    await expect(page.getByText('پرداخت انجام نشد یا لغو شد')).toBeVisible()
  })

  test('shows failure UI when status is missing', async ({ page }) => {
    await page.goto('/payment/result')

    await expect(page.getByText('پرداخت ناموفق')).toBeVisible()
  })

  test('failure UI does NOT show tracking code section', async ({ page }) => {
    await page.goto('/payment/result?status=failed')

    await expect(page.getByText('کد پیگیری')).not.toBeVisible()
    // Failure icon (red X)
    await expect(page.locator('.bg-red-100')).toBeVisible()
  })

  test('رزرو نوبت جدید button present after failure', async ({ page }) => {
    await page.goto('/payment/result?status=failed')

    await expect(page.getByRole('button', { name: 'رزرو نوبت جدید' })).toBeVisible()
  })
})

// ── Appointment state remains valid after failed payment ──────────────────────

test.describe('appointment integrity after payment failure', () => {
  /**
   * A failed payment means the appointment was created but payment didn't
   * go through.  The customer should be able to retry by booking again.
   * We verify:
   *  1. The failure page shows appropriate guidance.
   *  2. The customer can start a new booking from the failure page.
   */

  test('failure page directs user back to providers for retry', async ({ page }) => {
    await page.goto('/payment/result?status=failed&tracking_code=TRK-FAIL-01')

    // The failure screen should be present (not the success screen)
    await expect(page.getByText('پرداخت ناموفق')).toBeVisible()
    await expect(page.getByText('پرداخت موفق')).not.toBeVisible()

    // Primary CTA leads back to booking flow
    await page.getByRole('button', { name: 'رزرو نوبت جدید' }).click()
    await expect(page).toHaveURL(/providers/)
  })
})
