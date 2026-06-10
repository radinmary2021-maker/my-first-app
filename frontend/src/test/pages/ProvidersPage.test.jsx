/**
 * Tests for ProvidersPage (owner/ProvidersPage.jsx)
 *
 * Mock strategy: vi.mock() at the module level (hoisted before imports) so the
 * real useQuery is NEVER called during test setup/teardown.  This prevents React
 * from seeing a hook-count change when vi.restoreAllMocks() restored the real
 * implementation between tests.
 *
 * Each test calls mockHooks() to set the return values for that scenario.
 *
 * Coverage:
 *  1.  Loading / error / empty states
 *  2.  Provider list renders correctly
 *  3.  Solo fast-path happy path
 *  4.  Solo fast-path error
 *  5.  Add form — client-side validation
 *  6.  Add form — successful submission
 *  7.  Add form — server error display
 *  8.  Edit form — pre-populated fields, submission
 *  9.  Deactivate — confirmation dialog + confirm/cancel
 *  10. Reactivate — one-click button
 *  11. Role-based visibility — owner vs. legacy provider
 *  12. Retry on error
 */

import { screen, fireEvent, act, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../utils'
import ProvidersPage from '../../pages/owner/ProvidersPage'
import {
  useBusinessProviders,
  useCreateBusinessProvider,
  useUpdateBusinessProvider,
  useDeactivateBusinessProvider,
} from '../../hooks/useBusinessProviders'
import { useAuthStore } from '../../store/authStore'
import { ToastContainer } from '../../components/Toast'

// ── Hoist mock before imports ─────────────────────────────────────────────────

vi.mock('../../hooks/useBusinessProviders')

// ── Mock data ─────────────────────────────────────────────────────────────────

const OWNER_USER = {
  id: 1, phone: '09121234567', full_name: 'علی رضایی', role: 'owner',
}

const PROVIDER_USER = {
  id: 2, phone: '09129876543', full_name: 'مریم صادقی', role: 'provider',
}

const activeProvider = {
  id: 10, full_name: 'دکتر احمدی', phone: '09361112233',
  specialty: 'قلب', bio: '', is_active: true,
}

const inactiveProvider = {
  id: 11, full_name: 'دکتر حسینی', phone: '09364445566',
  specialty: '', bio: '', is_active: false,
}

// ── Hook mock helpers ─────────────────────────────────────────────────────────

const mockRefetch = vi.fn()
const noopMutate  = vi.fn()

function mockHooks({
  providers        = [],
  isLoading        = false,
  isError          = false,
  createMutate     = noopMutate,
  updateMutate     = noopMutate,
  deactivateMutate = noopMutate,
} = {}) {
  useBusinessProviders.mockReturnValue({
    data:      isLoading || isError ? undefined : providers,
    isLoading,
    isError,
    refetch:   mockRefetch,
  })
  useCreateBusinessProvider.mockReturnValue({
    mutate:    createMutate,
    isPending: false,
  })
  useUpdateBusinessProvider.mockReturnValue({
    mutate:    updateMutate,
    isPending: false,
  })
  useDeactivateBusinessProvider.mockReturnValue({
    mutate:    deactivateMutate,
    isPending: false,
  })
}

function seedUser(user = OWNER_USER) {
  useAuthStore.setState({ user, accessToken: 'test-token' })
}

function renderPage(user = OWNER_USER) {
  seedUser(user)
  return renderWithProviders(
    <>
      <ProvidersPage />
      <ToastContainer />
    </>
  )
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset call counts but keep the vi.mock() stubs in place
  vi.clearAllMocks()
  // Provide safe defaults so any accidental render before mockHooks() doesn't crash
  mockHooks()
})

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null })
})

// ── 1. Loading / error / empty states ────────────────────────────────────────

describe('ProvidersPage — loading and error states', () => {

  it('shows spinner while loading', () => {
    mockHooks({ isLoading: true })
    renderPage()
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('shows error message when fetch fails', () => {
    mockHooks({ isError: true })
    renderPage()
    expect(screen.getByText(/خطا در دریافت لیست ارائه‌دهندگان/)).toBeInTheDocument()
  })

  it('shows retry button on error', () => {
    mockHooks({ isError: true })
    renderPage()
    expect(screen.getByRole('button', { name: 'تلاش مجدد' })).toBeInTheDocument()
  })

  it('calls refetch when retry is clicked', () => {
    mockHooks({ isError: true })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'تلاش مجدد' }))
    expect(mockRefetch).toHaveBeenCalledOnce()
  })

  it('shows empty-state card when no providers', () => {
    mockHooks({ providers: [] })
    renderPage()
    expect(screen.getByText('هنوز ارائه‌دهنده‌ای ندارید')).toBeInTheDocument()
  })

})

// ── 2. Provider list ──────────────────────────────────────────────────────────

describe('ProvidersPage — provider list', () => {

  it('renders provider name, phone, specialty', () => {
    mockHooks({ providers: [activeProvider] })
    renderPage()
    expect(screen.getByText('دکتر احمدی')).toBeInTheDocument()
    expect(screen.getByText('09361112233')).toBeInTheDocument()
    expect(screen.getByText('قلب')).toBeInTheDocument()
  })

  it('shows active and inactive status badges', () => {
    mockHooks({ providers: [activeProvider, inactiveProvider] })
    renderPage()
    expect(screen.getByText('فعال')).toBeInTheDocument()
    expect(screen.getByText('غیرفعال')).toBeInTheDocument()
  })

  it('shows the header add-button when providers exist', () => {
    mockHooks({ providers: [activeProvider] })
    renderPage()
    expect(screen.getByRole('button', { name: '+ افزودن ارائه‌دهنده' })).toBeInTheDocument()
  })

  it('does NOT show header add-button when list is empty (onboarding card instead)', () => {
    mockHooks({ providers: [] })
    renderPage()
    expect(screen.queryByRole('button', { name: '+ افزودن ارائه‌دهنده' })).not.toBeInTheDocument()
  })

})

// ── 3. Solo fast-path ─────────────────────────────────────────────────────────

describe('ProvidersPage — solo fast-path', () => {

  it('shows "افزودن خودم" button for owners on empty state', () => {
    mockHooks({ providers: [] })
    renderPage(OWNER_USER)
    expect(screen.getByRole('button', { name: /افزودن خودم به عنوان ارائه‌دهنده/ })).toBeInTheDocument()
  })

  it('shows "افزودن ارائه‌دهنده دیگر" button in empty state', () => {
    mockHooks({ providers: [] })
    renderPage()
    expect(screen.getByRole('button', { name: 'افزودن ارائه‌دهنده دیگر' })).toBeInTheDocument()
  })

  it('shows next-step guidance text', () => {
    mockHooks({ providers: [] })
    renderPage()
    expect(screen.getByText(/مرحله بعد: افزودن خدمات و تنظیم ساعات کاری/)).toBeInTheDocument()
  })

  it('calls createMutate with user phone and full_name', () => {
    const createMutate = vi.fn()
    mockHooks({ providers: [], createMutate })
    renderPage(OWNER_USER)

    fireEvent.click(screen.getByRole('button', { name: /افزودن خودم/ }))

    expect(createMutate).toHaveBeenCalledWith(
      { phone: '09121234567', full_name: 'علی رضایی' },
      expect.any(Object)
    )
  })

  it('shows loading text while solo request is in flight', () => {
    const createMutate = vi.fn() // never fires callbacks → stays loading
    mockHooks({ providers: [], createMutate })
    renderPage(OWNER_USER)

    fireEvent.click(screen.getByRole('button', { name: /افزودن خودم/ }))

    expect(screen.getByRole('button', { name: /در حال افزودن/ })).toBeInTheDocument()
  })

  it('hides management buttons for legacy provider role', () => {
    mockHooks({ providers: [] })
    renderPage(PROVIDER_USER)
    expect(screen.queryByRole('button', { name: /افزودن خودم/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'افزودن ارائه‌دهنده دیگر' })).not.toBeInTheDocument()
  })

})

// ── 4. Solo fast-path errors ──────────────────────────────────────────────────

describe('ProvidersPage — solo fast-path errors', () => {

  it('shows error toast and resets loading when request fails', () => {
    vi.useFakeTimers()
    const error        = { response: { data: { error: 'این کاربر قبلاً ارائه‌دهنده است.' } } }
    const createMutate = vi.fn((_data, { onError }) => onError(error))
    mockHooks({ providers: [], createMutate })
    renderPage(OWNER_USER)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /افزودن خودم/ }))
    })

    expect(screen.getByText('این کاربر قبلاً ارائه‌دهنده است.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /افزودن خودم به عنوان ارائه‌دهنده/ })).not.toBeDisabled()
    vi.useRealTimers()
  })

  it('shows generic error when server returns no specific message', () => {
    vi.useFakeTimers()
    const createMutate = vi.fn((_data, { onError }) => onError({}))
    mockHooks({ providers: [], createMutate })
    renderPage(OWNER_USER)

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /افزودن خودم/ }))
    })

    expect(screen.getByText(/خطا در افزودن ارائه‌دهنده/)).toBeInTheDocument()
    vi.useRealTimers()
  })

})

// ── 5. Add form — client-side validation ─────────────────────────────────────

describe('ProvidersPage — add form validation', () => {

  function openAddModal() {
    mockHooks({ providers: [activeProvider] })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '+ افزودن ارائه‌دهنده' }))
  }

  it('opens add form modal', () => {
    openAddModal()
    expect(screen.getByRole('dialog', { name: 'افزودن ارائه‌دهنده' })).toBeInTheDocument()
  })

  it('closes modal on انصراف', () => {
    openAddModal()
    fireEvent.click(screen.getByRole('button', { name: 'انصراف' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes modal on × button', () => {
    openAddModal()
    fireEvent.click(screen.getByRole('button', { name: 'بستن' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows required error for empty phone on submit', () => {
    openAddModal()
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))
    expect(screen.getByText('شماره موبایل الزامی است.')).toBeInTheDocument()
  })

  it('shows format error for invalid phone', () => {
    openAddModal()
    fireEvent.change(screen.getByLabelText(/شماره موبایل/), { target: { value: '0912' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))
    expect(screen.getByText(/فرمت شماره موبایل صحیح نیست/)).toBeInTheDocument()
  })

  it('shows required error for empty name when phone is valid', () => {
    openAddModal()
    fireEvent.change(screen.getByLabelText(/شماره موبایل/), { target: { value: '09123456789' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))
    expect(screen.getByText('نام الزامی است.')).toBeInTheDocument()
  })

  it('shows min-length error for a one-character name', () => {
    openAddModal()
    fireEvent.change(screen.getByLabelText(/شماره موبایل/), { target: { value: '09123456789' } })
    fireEvent.change(screen.getByLabelText(/نام کامل/),     { target: { value: 'ع' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))
    expect(screen.getByText('نام باید حداقل ۲ کاراکتر باشد.')).toBeInTheDocument()
  })

  it('does NOT call mutate when client validation fails', () => {
    const createMutate = vi.fn()
    mockHooks({ providers: [activeProvider], createMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '+ افزودن ارائه‌دهنده' }))
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))
    expect(createMutate).not.toHaveBeenCalled()
  })

})

// ── 6. Add form — successful submission ──────────────────────────────────────

describe('ProvidersPage — add form submission', () => {

  it('calls createMutate with correct payload', () => {
    const createMutate = vi.fn()
    mockHooks({ providers: [activeProvider], createMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '+ افزودن ارائه‌دهنده' }))

    fireEvent.change(screen.getByLabelText(/شماره موبایل/), { target: { value: '09361112244' } })
    fireEvent.change(screen.getByLabelText(/نام کامل/),     { target: { value: 'دکتر جدید' } })
    fireEvent.change(screen.getByLabelText('تخصص'),          { target: { value: 'عمومی' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))

    expect(createMutate).toHaveBeenCalledWith(
      { phone: '09361112244', full_name: 'دکتر جدید', specialty: 'عمومی', bio: '' },
      expect.any(Object)
    )
  })

  it('trims whitespace from phone and name before submitting', () => {
    const createMutate = vi.fn()
    mockHooks({ providers: [activeProvider], createMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '+ افزودن ارائه‌دهنده' }))

    fireEvent.change(screen.getByLabelText(/شماره موبایل/), { target: { value: '  09361112244  ' } })
    fireEvent.change(screen.getByLabelText(/نام کامل/),     { target: { value: '  دکتر جدید  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ phone: '09361112244', full_name: 'دکتر جدید' }),
      expect.any(Object)
    )
  })

  it('closes modal after successful add', () => {
    const createMutate = vi.fn((_data, { onSuccess }) => onSuccess())
    mockHooks({ providers: [activeProvider], createMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '+ افزودن ارائه‌دهنده' }))

    fireEvent.change(screen.getByLabelText(/شماره موبایل/), { target: { value: '09361112244' } })
    fireEvent.change(screen.getByLabelText(/نام کامل/),     { target: { value: 'دکتر جدید' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

})

// ── 7. Add form — server errors ───────────────────────────────────────────────

describe('ProvidersPage — add form server errors', () => {

  it('shows server field-level phone error', () => {
    const createMutate = vi.fn((_data, { onError }) =>
      onError({ response: { data: { phone: ['این شماره قبلاً ثبت شده است.'] } } })
    )
    mockHooks({ providers: [activeProvider], createMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '+ افزودن ارائه‌دهنده' }))

    fireEvent.change(screen.getByLabelText(/شماره موبایل/), { target: { value: '09361112244' } })
    fireEvent.change(screen.getByLabelText(/نام کامل/),     { target: { value: 'دکتر جدید' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))

    expect(screen.getByText('این شماره قبلاً ثبت شده است.')).toBeInTheDocument()
  })

  it('shows server error.error message as general error', () => {
    const createMutate = vi.fn((_data, { onError }) =>
      onError({ response: { data: { error: 'این کاربر پروفایل ارائه‌دهنده دارد.' } } })
    )
    mockHooks({ providers: [activeProvider], createMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '+ افزودن ارائه‌دهنده' }))

    fireEvent.change(screen.getByLabelText(/شماره موبایل/), { target: { value: '09361112244' } })
    fireEvent.change(screen.getByLabelText(/نام کامل/),     { target: { value: 'دکتر جدید' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))

    expect(screen.getByText('این کاربر پروفایل ارائه‌دهنده دارد.')).toBeInTheDocument()
  })

  it('shows generic error when server returns empty body', () => {
    const createMutate = vi.fn((_data, { onError }) => onError({}))
    mockHooks({ providers: [activeProvider], createMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '+ افزودن ارائه‌دهنده' }))

    fireEvent.change(screen.getByLabelText(/شماره موبایل/), { target: { value: '09361112244' } })
    fireEvent.change(screen.getByLabelText(/نام کامل/),     { target: { value: 'دکتر جدید' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))

    expect(screen.getByText(/خطا در ذخیره اطلاعات/)).toBeInTheDocument()
  })

  it('keeps modal open after server error', () => {
    const createMutate = vi.fn((_data, { onError }) => onError({}))
    mockHooks({ providers: [activeProvider], createMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: '+ افزودن ارائه‌دهنده' }))

    fireEvent.change(screen.getByLabelText(/شماره موبایل/), { target: { value: '09361112244' } })
    fireEvent.change(screen.getByLabelText(/نام کامل/),     { target: { value: 'دکتر جدید' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))

    expect(screen.getByRole('dialog', { name: 'افزودن ارائه‌دهنده' })).toBeInTheDocument()
  })

})

// ── 8. Edit form ──────────────────────────────────────────────────────────────

describe('ProvidersPage — edit provider', () => {

  it('opens edit modal when clicking ویرایش', () => {
    mockHooks({ providers: [activeProvider] })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'ویرایش' }))
    expect(screen.getByRole('dialog', { name: 'ویرایش ارائه‌دهنده' })).toBeInTheDocument()
  })

  it('pre-populates specialty from provider data', () => {
    mockHooks({ providers: [activeProvider] })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'ویرایش' }))
    expect(screen.getByLabelText('تخصص')).toHaveValue('قلب')
  })

  it('does NOT show phone or name fields in edit mode', () => {
    mockHooks({ providers: [activeProvider] })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'ویرایش' }))
    expect(screen.queryByLabelText(/شماره موبایل/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/نام کامل/)).not.toBeInTheDocument()
  })

  it('calls updateMutate with providerId and updated specialty', () => {
    const updateMutate = vi.fn()
    mockHooks({ providers: [activeProvider], updateMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'ویرایش' }))

    fireEvent.change(screen.getByLabelText('تخصص'), { target: { value: 'اعصاب' } })
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))

    expect(updateMutate).toHaveBeenCalledWith(
      { providerId: activeProvider.id, data: { specialty: 'اعصاب', bio: '' } },
      expect.any(Object)
    )
  })

  it('closes edit modal after successful update', () => {
    const updateMutate = vi.fn((_payload, { onSuccess }) => onSuccess())
    mockHooks({ providers: [activeProvider], updateMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'ویرایش' }))
    fireEvent.click(screen.getByRole('button', { name: 'ذخیره' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

})

// ── 9. Deactivate ─────────────────────────────────────────────────────────────

describe('ProvidersPage — deactivate provider', () => {

  it('shows غیرفعال‌سازی button for active providers (owner)', () => {
    mockHooks({ providers: [activeProvider] })
    renderPage()
    expect(screen.getByRole('button', { name: 'غیرفعال‌سازی' })).toBeInTheDocument()
  })

  it('does NOT show غیرفعال‌سازی for inactive providers', () => {
    mockHooks({ providers: [inactiveProvider] })
    renderPage()
    expect(screen.queryByRole('button', { name: 'غیرفعال‌سازی' })).not.toBeInTheDocument()
  })

  it('opens confirmation dialog with provider name scoped inside', () => {
    mockHooks({ providers: [activeProvider] })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'غیرفعال‌سازی' }))
    const dialog = screen.getByRole('dialog', { name: 'غیرفعال‌سازی ارائه‌دهنده' })
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText(/دکتر احمدی/)).toBeInTheDocument()
  })

  it('closes dialog on انصراف without calling deactivate', () => {
    const deactivateMutate = vi.fn()
    mockHooks({ providers: [activeProvider], deactivateMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'غیرفعال‌سازی' }))
    fireEvent.click(screen.getByRole('button', { name: 'انصراف' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(deactivateMutate).not.toHaveBeenCalled()
  })

  it('calls deactivateMutate with provider id on confirm', () => {
    const deactivateMutate = vi.fn()
    mockHooks({ providers: [activeProvider], deactivateMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'غیرفعال‌سازی' }))
    fireEvent.click(screen.getByRole('button', { name: 'غیرفعال کن' }))

    expect(deactivateMutate).toHaveBeenCalledWith(activeProvider.id, expect.any(Object))
  })

  it('closes dialog after deactivation succeeds', () => {
    const deactivateMutate = vi.fn((_id, { onSuccess }) => onSuccess())
    mockHooks({ providers: [activeProvider], deactivateMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'غیرفعال‌سازی' }))
    fireEvent.click(screen.getByRole('button', { name: 'غیرفعال کن' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

})

// ── 10. Reactivate ────────────────────────────────────────────────────────────

describe('ProvidersPage — reactivate provider', () => {

  it('shows فعال‌سازی button for inactive providers (owner)', () => {
    mockHooks({ providers: [inactiveProvider] })
    renderPage()
    expect(screen.getByRole('button', { name: 'فعال‌سازی' })).toBeInTheDocument()
  })

  it('calls updateMutate with is_active: true', () => {
    const updateMutate = vi.fn()
    mockHooks({ providers: [inactiveProvider], updateMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'فعال‌سازی' }))

    expect(updateMutate).toHaveBeenCalledWith(
      { providerId: inactiveProvider.id, data: { is_active: true } },
      expect.any(Object)
    )
  })

})

// ── 11. Role-based visibility ─────────────────────────────────────────────────

describe('ProvidersPage — role-based visibility', () => {

  it('owner sees edit and deactivate buttons', () => {
    mockHooks({ providers: [activeProvider] })
    renderPage(OWNER_USER)
    expect(screen.getByRole('button', { name: 'ویرایش' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'غیرفعال‌سازی' })).toBeInTheDocument()
  })

  it('legacy provider role hides all management actions', () => {
    mockHooks({ providers: [activeProvider] })
    renderPage(PROVIDER_USER)
    expect(screen.queryByRole('button', { name: 'ویرایش' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'غیرفعال‌سازی' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+ افزودن ارائه‌دهنده' })).not.toBeInTheDocument()
  })

  it('legacy provider still sees the provider list', () => {
    mockHooks({ providers: [activeProvider] })
    renderPage(PROVIDER_USER)
    expect(screen.getByText('دکتر احمدی')).toBeInTheDocument()
    expect(screen.getByText('09361112233')).toBeInTheDocument()
  })

})
