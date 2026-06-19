import { screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../utils'
import SetupProfilePage from '../../pages/auth/SetupProfilePage'
import * as authApi from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

const BTN = /تکمیل و ورود به نوبتیک/

function seedUser(overrides = {}) {
  useAuthStore.setState({
    user: { id: 1, phone: '09121234567', full_name: '', role: 'patient' },
    accessToken: 'test-access',
    ...overrides,
  })
}

function getNameInput() {
  return screen.getByLabelText(/نام و نام خانوادگی/)
}

beforeEach(() => {
  seedUser()
})

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null })
})

describe('SetupProfilePage', () => {
  it('renders the form with name input and submit button', () => {
    renderWithProviders(<SetupProfilePage />)
    expect(getNameInput()).toBeInTheDocument()
    expect(screen.getByRole('button', { name: BTN })).toBeInTheDocument()
  })

  it('shows user phone number', () => {
    renderWithProviders(<SetupProfilePage />)
    expect(screen.getByText('09121234567')).toBeInTheDocument()
  })

  it('submit button is disabled when input is empty', () => {
    renderWithProviders(<SetupProfilePage />)
    expect(screen.getByRole('button', { name: BTN })).toBeDisabled()
  })

  it('submit button enables when name is typed', () => {
    renderWithProviders(<SetupProfilePage />)
    fireEvent.change(getNameInput(), { target: { value: 'علی رضایی' } })
    expect(screen.getByRole('button', { name: BTN })).not.toBeDisabled()
  })

  it('shows client-side error when name is too short', async () => {
    renderWithProviders(<SetupProfilePage />)
    fireEvent.change(getNameInput(), { target: { value: 'ع' } })
    fireEvent.submit(screen.getByRole('button', { name: BTN }).closest('form'))
    await waitFor(() => {
      expect(screen.getByText('نام باید حداقل ۲ کاراکتر باشد.')).toBeInTheDocument()
    })
  })

  it('calls updateProfile with the entered name on success', async () => {
    const updatedUser = { id: 1, phone: '09121234567', full_name: 'علی رضایی', role: 'customer' }
    vi.spyOn(authApi, 'updateProfile').mockResolvedValue(updatedUser)

    renderWithProviders(<SetupProfilePage />, { route: '/setup-profile' })
    fireEvent.change(getNameInput(), { target: { value: 'علی رضایی' } })
    fireEvent.click(screen.getByRole('button', { name: BTN }))

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalledWith({ fullName: 'علی رضایی' })
    })
  })

  it('updates Zustand user store after successful save', async () => {
    const updatedUser = { id: 1, phone: '09121234567', full_name: 'مریم صادقی', role: 'patient' }
    vi.spyOn(authApi, 'updateProfile').mockResolvedValue(updatedUser)

    renderWithProviders(<SetupProfilePage />)
    fireEvent.change(getNameInput(), { target: { value: 'مریم صادقی' } })

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: BTN }))
      await waitFor(() => expect(authApi.updateProfile).toHaveBeenCalled())
    })

    expect(useAuthStore.getState().user.full_name).toBe('مریم صادقی')
  })

  it('trims whitespace before submitting', async () => {
    vi.spyOn(authApi, 'updateProfile').mockResolvedValue({ id: 1, phone: '09121234567', full_name: 'علی', role: 'patient' })

    renderWithProviders(<SetupProfilePage />)
    fireEvent.change(getNameInput(), { target: { value: '  علی  ' } })
    fireEvent.click(screen.getByRole('button', { name: BTN }))

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalledWith({ fullName: 'علی' })
    })
  })

  it('shows server error message on API failure', async () => {
    vi.spyOn(authApi, 'updateProfile').mockRejectedValue({
      response: { data: { error: 'خطای سرور' } },
    })

    renderWithProviders(<SetupProfilePage />)
    fireEvent.change(getNameInput(), { target: { value: 'علی رضایی' } })
    fireEvent.click(screen.getByRole('button', { name: BTN }))

    await waitFor(() => {
      expect(screen.getByText('خطای سرور')).toBeInTheDocument()
    })
  })

  it('shows generic error when server returns no message', async () => {
    vi.spyOn(authApi, 'updateProfile').mockRejectedValue({})

    renderWithProviders(<SetupProfilePage />)
    fireEvent.change(getNameInput(), { target: { value: 'علی رضایی' } })
    fireEvent.click(screen.getByRole('button', { name: BTN }))

    await waitFor(() => {
      expect(screen.getByText(/خطا در ذخیره اطلاعات/)).toBeInTheDocument()
    })
  })

  it('shows loading state while submitting', async () => {
    let resolve
    vi.spyOn(authApi, 'updateProfile').mockReturnValue(new Promise((r) => { resolve = r }))

    renderWithProviders(<SetupProfilePage />)
    fireEvent.change(getNameInput(), { target: { value: 'علی رضایی' } })
    fireEvent.click(screen.getByRole('button', { name: BTN }))

    await waitFor(() => {
      expect(screen.getByRole('status', { name: /بارگذاری/ })).toBeInTheDocument()
    })
    resolve({ id: 1, phone: '09121234567', full_name: 'علی رضایی', role: 'patient' })
  })
})
