/**
 * Reusable API mock helpers.
 *
 * All helpers accept a `page` and register route interceptors that return
 * deterministic mock responses.  This lets tests run without a live backend.
 *
 * Naming convention: mockXxx(page, data?) — data overrides the default fixture.
 */

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
} from './fixtures.js'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Shorthand: respond with JSON at matching URL. */
async function json(page, url, body, status = 200) {
  await page.route(url, (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    }),
  )
}

// ── Auth endpoints ─────────────────────────────────────────────────────────────

export async function mockSendOtp(page) {
  await json(page, '**/api/auth/send-otp/', { message: 'کد تأیید ارسال شد.' })
}

export async function mockVerifyOtp(page, userOverride = {}, withBusiness = false) {
  await json(page, '**/api/auth/verify-otp/', {
    access: TOKENS.access,
    refresh: TOKENS.refresh,
    user: { ...NEW_USER, ...userOverride },
    business: withBusiness ? BUSINESS : null,
  })
}

export async function mockGetCurrentUser(page, userOverride = {}) {
  await json(page, '**/api/auth/me/', { ...OWNER_USER, ...userOverride })
}

export async function mockUpdateProfile(page, userOverride = {}) {
  await page.route('**/api/auth/me/', async (route) => {
    if (route.request().method() === 'PATCH') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...OWNER_USER, ...userOverride }),
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...OWNER_USER, ...userOverride }),
      })
    }
  })
}

export async function mockTokenRefresh(page) {
  await json(page, '**/api/auth/refresh/', { access: TOKENS.access })
}

// ── Business categories ────────────────────────────────────────────────────────

export async function mockCategories(page) {
  await json(page, '**/api/providers/categories/', [
    { value: 'general', label: 'عمومی' },
    { value: 'dental', label: 'دندانپزشکی' },
    { value: 'beauty', label: 'زیبایی' },
  ])
}

// ── Business CRUD ──────────────────────────────────────────────────────────────

export async function mockCreateBusiness(page) {
  await json(page, '**/api/v1/businesses/', BUSINESS)
}

export async function mockGetMyBusiness(page) {
  await json(page, '**/api/v1/businesses/me/', BUSINESS)
}

// ── Business providers (management) ───────────────────────────────────────────

export async function mockBusinessProviders(page, providers = [BUSINESS_PROVIDER]) {
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

export async function mockEmptyBusinessProviders(page) {
  await mockBusinessProviders(page, [])
}

// ── Public providers (customer-facing) ────────────────────────────────────────

export async function mockPublicProviders(page, providers = [PROVIDER_CARD]) {
  await page.route(/\/api\/providers\/$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(providers),
    }),
  )
}

export async function mockPublicProvider(page, provider = PROVIDER_CARD) {
  const id = provider.id
  await page.route(new RegExp(`/api/providers/${id}[/?]?$`), (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(provider),
    }),
  )
}

export async function mockProviderSlots(page, slots = ['09:00', '09:30', '10:00', '10:30']) {
  await page.route(/\/api\/providers\/\d+\/slots/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ slots }),
    }),
  )
}

export async function mockProviderServices(page, services = []) {
  await page.route(/\/api\/providers\/\d+\/services/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(services),
    }),
  )
}

// ── Business services ──────────────────────────────────────────────────────────

export async function mockBusinessServices(page, services = [SERVICE]) {
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

export async function mockWorkingHours(page, hours = [WORKING_HOURS]) {
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

export async function mockTimeOffs(page, timeoffs = []) {
  await page.route(/\/api\/v1\/businesses\/me\/timeoffs/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(timeoffs),
    }),
  )
}

// ── Appointments (owner / business) ───────────────────────────────────────────

export async function mockBusinessAppointments(page, appts = [CONFIRMED_APPT, PENDING_APPT]) {
  await page.route(/\/api\/v1\/appointments\/business/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(appts),
    }),
  )
}

export async function mockProviderAppointments(page, appts = [CONFIRMED_APPT]) {
  await page.route(/\/api\/appointments\/provider/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(appts),
    }),
  )
}

export async function mockAppointmentAction(page, action) {
  await page.route(new RegExp(`/api/appointments/\\d+/${action}`), (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'ok' }),
    }),
  )
}

// ── Appointments (customer) ────────────────────────────────────────────────────

export async function mockMyAppointments(page, appts = [MY_APPT]) {
  await page.route(/\/api\/appointments\/mine/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(appts),
    }),
  )
}

export async function mockCreateAppointment(page, appointmentOverride = {}) {
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

export async function mockInitiatePayment(page, trackingCode = 'TRK-NEW-01') {
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

export async function mockNetworkError(page, url) {
  await page.route(url, (route) => route.abort('failed'))
}

export async function mock500(page, url) {
  await page.route(url, (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'خطای سرور' }),
    }),
  )
}

export async function mock404(page, url) {
  await page.route(url, (route) =>
    route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'یافت نشد.' }),
    }),
  )
}

// ── Beta feedback ──────────────────────────────────────────────────────────────

export async function mockFeedback(page) {
  await page.route('**/api/v1/feedback/', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ id: 1, status: 'received' }),
    }),
  )
}
