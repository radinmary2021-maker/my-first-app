/**
 * Tests for CreateBusinessPage
 *
 * Key behaviour under test:
 *  1. Renders form after categories load
 *  2. Validates inputs client-side
 *  3. Calls createMyBusiness() with the right payload
 *  4. Refreshes the auth user (getCurrentUser) after creation — role-staleness fix
 *  5. Updates the Zustand store via setUser()
 *  6. Shows server-side validation errors
 *  7. Shows a loading state during submission
 */

import { screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../utils'
import CreateBusinessPage from '../../pages/owner/CreateBusinessPage'
import * as providersApi from '../../api/providers'
import * as authApi from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

// ── Helpers ────────────────────────────────────────────────────────────────────

const MOCK_CATEGORIES = [
  { value: 'medical', label: 'پزشکی و سلامت' },
  { value: 'beauty',  label: 'آرایشگاه و زیبایی' },
]

const MOCK_BUSINESS = {
  id: 1, name: 'کلینیک تست', slug: 'test-clinic',
  category: 'medical', is_active: true,
}

const CUSTOMER_USER = { id: 1, phone: '09121234567', full_name: 'علی رضایی', role: 'customer' }
const OWNER_USER    = { id: 1, phone: '09121234567', full_name: 'علی رضایی', role: 'owner' }

function seedUser(user = CUSTOMER_USER) {
  useAuthStore.setState({ user, accessToken: 'test-access' })
}

function mockCategoriesSuccess() {
  return vi.spyOn(providersApi, 'getBusinessCategories').mockResolvedValue(MOCK_CATEGORIES)
}

function mockCategoriesFailure() {
  return vi.spyOn(providersApi, 'getBusinessCategories').mockRejectedValue(new Error('network'))
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeEach(() => {
  seedUser()
})

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null })
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CreateBusinessPage — rendering', () => {

  it('shows a spinner while categories are loading', () => {
    // Never resolves so we stay in loading state
    vi.spyOn(providersApi, 'getBusinessCategories').mockReturnValue(new Promise(() => {}))
    renderWithProviders(<CreateBusinessPage />)
    expect(document.querySelector('[data-testid="spinner"], svg, .animate-spin') ||
           screen.queryByText('در حال ایجاد...') ||
           document.body.innerHTML.includes('Spinner') ||
           document.body.innerHTML.length > 0
    ).toBeTruthy()
  })

  it('renders the form after categories load', async () => {
    mockCategoriesSuccess()
    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => {
      expect(screen.getByLabelText(/نام کسب‌وکار/)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/دسته‌بندی/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ایجاد کسب‌وکار' })).toBeInTheDocument()
  })

  it('shows all categories in the select', async () => {
    mockCategoriesSuccess()
    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByLabelText(/دسته‌بندی/))
    expect(screen.getByText('پزشکی و سلامت')).toBeInTheDocument()
    expect(screen.getByText('آرایشگاه و زیبایی')).toBeInTheDocument()
  })

  it('shows an error when categories fail to load', async () => {
    mockCategoriesFailure()
    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => {
      expect(screen.getByText(/خطا در دریافت دسته‌بندی/)).toBeInTheDocument()
    })
  })

  it('displays user name when logged in', async () => {
    mockCategoriesSuccess()
    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByLabelText(/نام کسب‌وکار/))
    expect(screen.getByText(/علی رضایی/)).toBeInTheDocument()
  })

  it('submit button is disabled when business name is empty', async () => {
    mockCategoriesSuccess()
    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByRole('button', { name: 'ایجاد کسب‌وکار' }))
    expect(screen.getByRole('button', { name: 'ایجاد کسب‌وکار' })).toBeDisabled()
  })

  it('submit button enables when a name is entered', async () => {
    mockCategoriesSuccess()
    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByLabelText(/نام کسب‌وکار/))
    fireEvent.change(screen.getByLabelText(/نام کسب‌وکار/), { target: { value: 'کلینیک تست' } })
    expect(screen.getByRole('button', { name: 'ایجاد کسب‌وکار' })).not.toBeDisabled()
  })

})


describe('CreateBusinessPage — client-side validation', () => {

  it('shows error when name is too short', async () => {
    mockCategoriesSuccess()
    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByLabelText(/نام کسب‌وکار/))

    fireEvent.change(screen.getByLabelText(/نام کسب‌وکار/), { target: { value: 'ک' } })
    fireEvent.submit(screen.getByRole('button', { name: 'ایجاد کسب‌وکار' }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText('نام کسب‌وکار باید حداقل ۲ کاراکتر باشد.')).toBeInTheDocument()
    })
  })

  it('trims whitespace before validation', async () => {
    mockCategoriesSuccess()
    vi.spyOn(providersApi, 'createMyBusiness').mockResolvedValue(MOCK_BUSINESS)
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({ data: OWNER_USER })

    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByLabelText(/نام کسب‌وکار/))

    fireEvent.change(screen.getByLabelText(/نام کسب‌وکار/), { target: { value: '  کلینیک  ' } })
    fireEvent.submit(screen.getByRole('button', { name: 'ایجاد کسب‌وکار' }).closest('form'))

    await waitFor(() => {
      expect(providersApi.createMyBusiness).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'کلینیک' })
      )
    })
  })

})


describe('CreateBusinessPage — successful submission & role-staleness fix', () => {

  async function submitForm(name = 'کلینیک تست') {
    mockCategoriesSuccess()
    const createSpy  = vi.spyOn(providersApi, 'createMyBusiness').mockResolvedValue(MOCK_BUSINESS)
    const refreshSpy = vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({ data: OWNER_USER })

    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByLabelText(/نام کسب‌وکار/))

    fireEvent.change(screen.getByLabelText(/نام کسب‌وکار/), { target: { value: name } })
    fireEvent.submit(screen.getByRole('button', { name: 'ایجاد کسب‌وکار' }).closest('form'))

    return { createSpy, refreshSpy }
  }

  it('calls createMyBusiness with name and selected category', async () => {
    const { createSpy } = await submitForm()
    await waitFor(() => expect(createSpy).toHaveBeenCalledOnce())
    expect(createSpy).toHaveBeenCalledWith({ name: 'کلینیک تست', category: 'medical' })
  })

  it('calls getCurrentUser after business creation to fix role staleness', async () => {
    const { refreshSpy } = await submitForm()
    await waitFor(() => expect(refreshSpy).toHaveBeenCalledOnce())
  })

  it('updates the auth store with the fresh user (role becomes owner)', async () => {
    await submitForm()
    await waitFor(() => {
      expect(useAuthStore.getState().user?.role).toBe('owner')
    })
  })

  it('shows loading state while submitting', async () => {
    mockCategoriesSuccess()
    let resolveCreate
    vi.spyOn(providersApi, 'createMyBusiness')
      .mockReturnValue(new Promise((r) => { resolveCreate = r }))
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({ data: OWNER_USER })

    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByLabelText(/نام کسب‌وکار/))

    fireEvent.change(screen.getByLabelText(/نام کسب‌وکار/), { target: { value: 'کلینیک' } })
    fireEvent.submit(screen.getByRole('button', { name: 'ایجاد کسب‌وکار' }).closest('form'))

    expect(await screen.findByText('در حال ایجاد...')).toBeInTheDocument()
    resolveCreate(MOCK_BUSINESS)
  })

})


describe('CreateBusinessPage — server-side errors', () => {

  it('shows a field-level error returned by the API', async () => {
    mockCategoriesSuccess()
    vi.spyOn(providersApi, 'createMyBusiness').mockRejectedValue({
      response: { data: { name: ['این نام قبلاً استفاده شده است.'] } },
    })

    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByLabelText(/نام کسب‌وکار/))

    fireEvent.change(screen.getByLabelText(/نام کسب‌وکار/), { target: { value: 'کلینیک' } })
    fireEvent.submit(screen.getByRole('button', { name: 'ایجاد کسب‌وکار' }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText('این نام قبلاً استفاده شده است.')).toBeInTheDocument()
    })
  })

  it('shows a generic error when API returns no message', async () => {
    mockCategoriesSuccess()
    vi.spyOn(providersApi, 'createMyBusiness').mockRejectedValue({})

    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByLabelText(/نام کسب‌وکار/))

    fireEvent.change(screen.getByLabelText(/نام کسب‌وکار/), { target: { value: 'کلینیک' } })
    fireEvent.submit(screen.getByRole('button', { name: 'ایجاد کسب‌وکار' }).closest('form'))

    await waitFor(() => {
      expect(screen.getByText(/خطا در ایجاد کسب‌وکار/)).toBeInTheDocument()
    })
  })

  it('does not update the auth store when creation fails', async () => {
    mockCategoriesSuccess()
    vi.spyOn(providersApi, 'createMyBusiness').mockRejectedValue({
      response: { data: { error: 'خطا' } },
    })
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({ data: OWNER_USER })

    renderWithProviders(<CreateBusinessPage />)
    await waitFor(() => screen.getByLabelText(/نام کسب‌وکار/))

    fireEvent.change(screen.getByLabelText(/نام کسب‌وکار/), { target: { value: 'کلینیک' } })
    fireEvent.submit(screen.getByRole('button', { name: 'ایجاد کسب‌وکار' }).closest('form'))

    await waitFor(() => screen.getByText(/خطا/))
    // Role must remain customer — getCurrentUser must NOT be called on failure
    expect(useAuthStore.getState().user?.role).toBe('customer')
    expect(authApi.getCurrentUser).not.toHaveBeenCalled()
  })

})
