/**
 * Test fixtures — static data shared across all E2E specs.
 *
 * Keep them minimal: just enough for the tests to work, not a full data model.
 */

// ── Users ──────────────────────────────────────────────────────────────────────

export const OWNER_USER = {
  id: 1,
  phone: '09120000001',
  full_name: 'مالک تست',
  role: 'owner',
}

export const PROVIDER_USER = {
  id: 2,
  phone: '09120000002',
  full_name: 'ارائه‌دهنده تست',
  role: 'provider',
}

export const CUSTOMER_USER = {
  id: 3,
  phone: '09120000003',
  full_name: 'مشتری تست',
  role: 'customer',
}

export const NEW_USER = {
  id: 4,
  phone: '09120000004',
  full_name: '',   // name not yet set → triggers SetupProfilePage redirect
  role: 'customer',
}

// ── Business ───────────────────────────────────────────────────────────────────

export const BUSINESS = {
  id: 1,
  name: 'کلینیک تست',
  category: 'general',
}

// ── Providers (public list) ────────────────────────────────────────────────────

export const PROVIDER_CARD = {
  id: 10,
  business_name: 'کلینیک دکتر احمدی',
  full_name: 'دکتر علی احمدی',
  category_display: 'عمومی',
  specialty: 'عمومی',
  slot_duration: 30,
  service_fee: 150000,
  is_active: true,
  bio: '',
  // All 7 weekdays available so DatePicker is never fully disabled
  available_weekdays: [0, 1, 2, 3, 4, 5, 6],
}

// ── Business providers (management list) ──────────────────────────────────────

export const BUSINESS_PROVIDER = {
  id: 1,
  full_name: 'مالک تست',
  phone: '09120000001',
  specialty: 'عمومی',
  is_active: true,
}

// ── Services ───────────────────────────────────────────────────────────────────

export const SERVICE = {
  id: 1,
  name: 'ویزیت عمومی',
  duration_minutes: 30,
  buffer_minutes: 0,
  price: 150000,
  description: '',
  is_active: true,
}

// ── Working hours ──────────────────────────────────────────────────────────────

export const WORKING_HOURS = {
  id: 1,
  weekday: 0, // Saturday
  start_time: '09:00',
  end_time: '17:00',
}

// ── Appointments ───────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

export const CONFIRMED_APPT = {
  id: 100,
  tracking_code: 'TRK-CONF-01',
  customer_name: 'مشتری تست',
  customer_phone: '09120000003',
  provider_name: 'مالک تست',
  service_name: 'ویزیت عمومی',
  date: TODAY,
  start_time: '10:00',
  end_time: '10:30',
  status: 'confirmed',
  status_display: 'تأیید شده',
  total_price: 150000,
  deposit_paid: 0,
  notes: '',
}

export const PENDING_APPT = {
  ...CONFIRMED_APPT,
  id: 101,
  tracking_code: 'TRK-PEND-01',
  status: 'pending',
  status_display: 'در انتظار تأیید',
}

export const COMPLETED_APPT = {
  ...CONFIRMED_APPT,
  id: 102,
  tracking_code: 'TRK-COMP-01',
  status: 'completed',
  status_display: 'انجام شده',
}

// Appointment for customer's "my appointments" page
export const MY_APPT = {
  id: 200,
  tracking_code: 'TRK-MY-01',
  provider_name: 'کلینیک دکتر احمدی',
  provider_category: 'عمومی',
  service_name: 'ویزیت عمومی',
  date: TODAY,
  start_time: '10:00',
  end_time: '10:30',
  status: 'confirmed',
  status_display: 'تأیید شده',
}

// ── Tokens ─────────────────────────────────────────────────────────────────────

export const TOKENS = {
  access: 'test-access-token',
  refresh: 'test-refresh-token',
}
