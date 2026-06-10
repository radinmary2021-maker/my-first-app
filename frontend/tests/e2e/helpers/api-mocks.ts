/**
 * Reusable API mock helpers.
 *
 * All helpers accept a `page` and register route interceptors that return
 * deterministic mock responses.  This lets tests run without a live backend.
 *
 * URL patterns: use '**/api/...' so they match regardless of whether
 * VITE_API_BASE_URL is '' (relative) or 'http://localhost:8000'.
 *
 * Naming convention: mockXxx(page, data?) — data overrides the default fixture.
 */

import { type Page } from '@playwright/test'
import {
  TOKENS,
  OWNER_USER,
  NEW_USER,
  BUSINESS,
  PROVIDER_CARD,
  BUSINESS_PROVIDER,
  SERVICE,
  WORKING_HOURS,
  CONFIRMED_APPT,
  PENDING_APPT,
  COMPLETED_APPT,
  MY_APPT,
} from './fixtures'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Shorthand: respond with JSON at matching URL. */
async function json(page: Page, url: string, body: unknown, status = 200): Promise<void> {
  await page.route(url, (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  )
}

// ── Auth endpoints ─────────────────────────────────────────────────────────────

export async function mockSendOtp(page: Page): Promise<void> {
  await json(page, '**/api/auth/send-otp/', { message: 'کد تأیید ارسال شد.' })
}

export async function mockVerifyOtp(
  page: Page,
  userOverride: object = {},
  withBusiness = false,
): Promise<void> {
  await json(page, '**/api/auth/verify-otp/', {
    access: TOKENS.access,
    refresh: TOKENS.refresh,
    user: { ...NEW_USER, ...userOverride },
    business: withBusiness ? BUSINESS : null,
  })
}

export async function mockGetCurrentUser(
  page: Page,
  userOverride: object = {},
): Promise<void> {
  await json(page, '**/api/auth/me/', { ...OWNER_USER, ...userOverride })
}

export async function mockUpdateProfile(
  page: Page,
  userOverride: object = {},
): Promise<void> {
  // PATCH /api/auth/me/
  await page.route('**/api/auth/me/', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...OWNER_USER, ...userOverride }),
      })
    } else {
      // GET
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...OWNER_USER, ...userOverride }),
      })
    }
  })
}

export async function mockTokenRefresh(page: Page): Promise<void> {
  await json(page, '**/api/auth/refresh/', { access: TOKENS.access })
}

// ── Business categories ────────────────────────────────────────────────────────

export async function mockCategories(page: Page): Promise<void> {
  await json(page, '**/api/providers/categories/', [
    { value: 'general', label: 'عمومی' },
    { value: 'dental', label: 'دندانپزشکی' },
    { value: 'beauty', label: 'زیبایی' },
  ])
}

// ── Business CRUD ──────────────────────────────────────────────────────────────

export async function mockCreateBusiness(page: Page): Promise<void> {
  await json(page, '**/api/v1/businesses/', BUSINESS)
}

export async function mockGetMyBusiness(page: Page): Promise<void> {
  await json(page, '**/api/v1/businesses/me/', BUSINESS)
}

// ── Business providers (management) ───────────────────────────────────────────

export async function mockBusinessProviders(
  page: Page,
  providers: object[] = [BUSINESS_PROVIDER],
): Promise<void> {
  // Regex matches /api/v1/businesses/me/providers/ and /api/v1/businesses/me/providers/123/
  await page.route(/\/api\/v1\/businesses\/me\/providers/, async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(providers),
      })
    } else if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(BUSINESS_PROVIDER),
      })
    } else if (method === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(BUSINESS_PROVIDER),
      })
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204 })
    } else {
      await route.continue()
    }
  })
}

export async function mockEmptyBusinessProviders(page: Page): Promise<void> {
  await mockBusinessProviders(page, [])
}

// ── Public providers (customer-facing) ────────────────────────────────────────

export async function mockPublicProviders(
  page: Page,
  providers: object[] = [PROVIDER_CARD],
): Promise<void> {
  await page.route(/\/api\/providers\/$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(providers),
    }),
  )
}

export async function mockPublicProvider(
  page: Page,
  provider: object = PROVIDER_CARD,
): Promise<void> {
  const id = (provider as { id: number }).id
  // Match /api/providers/{id}/ — use regex to avoid trailing-slash ambiguity
  await page.route(new RegExp(`/api/providers/${id}[/?]?$`), (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(provider),
    }),
  )
}

export async function mockProviderSlots(
  page: Page,
  slots: string[] = ['09:00', '09:30', '10:00', '10:30'],
): Promise<void> {
  await page.route(/\/api\/providers\/\d+\/slots/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ slots }),
    }),
  )
}

export async function mockProviderServices(
  page: Page,
  services: object[] = [],
): Promise<void> {
  await page.route(/\/api\/providers\/\d+\/services/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(services),
    }),
  )
}

// ── Business services ──────────────────────────────────────────────────────────

export async function mockBusinessServices(
  page: Page,
  services: object[] = [SERVICE],
): Promise<void> {
  await page.route(/\/api\/v1\/businesses\/me\/services/, async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(services),
      })
    } else if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(SERVICE),
      })
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204 })
    } else {
      await route.continue()
    }
  })
}

// ── Working hours ──────────────────────────────────────────────────────────────

export async function mockWorkingHours(
  page: Page,
  hours: object[] = [WORKING_HOURS],
): Promise<void> {
  await page.route(/\/api\/v1\/businesses\/me\/working-hours/, async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(hours),
      })
    } else if (method === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(WORKING_HOURS),
      })
    } else if (method === 'DELETE') {
      await route.fulfill({ status: 204 })
    } else {
      await route.continue()
    }
  })
}

// ── Time offs ──────────────────────────────────────────────────────────────────

export async function mockTimeOffs(page: Page, timeoffs: object[] = []): Promise<void> {
  await page.route(/\/api\/v1\/businesses\/me\/timeoffs/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(timeoffs),
    }),
  )
}

// ── Appointments (owner / business) ───────────────────────────────────────────

export async function mockBusinessAppointments(
  page: Page,
  appts: object[] = [CONFIRMED_APPT, PENDING_APPT],
): Promise<void> {
  await page.route(/\/api\/v1\/appointments\/business/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(appts),
    }),
  )
}

export async function mockProviderAppointments(
  page: Page,
  appts: object[] = [CONFIRMED_APPT],
): Promise<void> {
  await page.route(/\/api\/appointments\/provider/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(appts),
    }),
  )
}

export async function mockAppointmentAction(page: Page, action: string): Promise<void> {
  await page.route(new RegExp(`/api/appointments/\\d+/${action}`), (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }),
    }),
  )
}

// ── Appointments (customer) ────────────────────────────────────────────────────

export async function mockMyAppointments(
  page: Page,
  appts: object[] = [MY_APPT],
): Promise<void> {
  await page.route(/\/api\/appointments\/mine/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(appts),
    }),
  )
}

export async function mockCreateAppointment(
  page: Page,
  appointmentOverride: object = {},
): Promise<void> {
  await page.route(/\/api\/appointments\/$/, async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 999,
          tracking_code: 'TRK-NEW-01',
          status: 'pending',
          ...appointmentOverride,
        }),
      })
    } else {
      await route.continue()
    }
  })
}

// ── Payment ────────────────────────────────────────────────────────────────────

/**
 * Mock payment initiation. Returns a gate_url that points back to our own app
 * so Playwright can follow the redirect and assert the result page.
 */
export async function mockInitiatePayment(
  page: Page,
  trackingCode = 'TRK-NEW-01',
): Promise<void> {
  await page.route(/\/api\/payments\/\d+\/initiate/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        gate_url: `http://localhost:5173/payment/result?status=success&tracking_code=${trackingCode}&ref_id=REF123`,
      }),
    }),
  )
}

// ── Error responses ────────────────────────────────────────────────────────────

export async function mockNetworkError(
  page: Page,
  url: string | RegExp,
): Promise<void> {
  await page.route(url, (route) => route.abort('failed'))
}

export async function mock500(page: Page, url: string | RegExp): Promise<void> {
  await page.route(url, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'خطای سرور' }),
    }),
  )
}

export async function mock404(page: Page, url: string | RegExp): Promise<void> {
  await page.route(url, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'یافت نشد.' }),
    }),
  )
}
