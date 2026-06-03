import { render, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import App from '../../App'
import * as authApi from '../../api/auth'
import { useAuthStore } from '../../store/authStore'

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ user: null, accessToken: null, refreshToken: null })
})

describe('SessionRefresh', () => {
  it('calls getCurrentUser when user and accessToken are present', async () => {
    useAuthStore.setState({
      user: { id: 1, phone: '09121234567', full_name: 'علی', role: 'patient' },
      accessToken: 'tok',
    })
    const spy = vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({
      data: { id: 1, phone: '09121234567', full_name: 'علی رضایی', role: 'patient' },
    })

    render(<App />)

    await waitFor(() => expect(spy).toHaveBeenCalledOnce())
  })

  it('updates Zustand user with fresh data from server', async () => {
    useAuthStore.setState({
      user: { id: 1, phone: '09121234567', full_name: 'نام قدیمی', role: 'patient' },
      accessToken: 'tok',
    })
    vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({
      data: { id: 1, phone: '09121234567', full_name: 'نام جدید', role: 'patient' },
    })

    render(<App />)

    await waitFor(() => {
      expect(useAuthStore.getState().user.full_name).toBe('نام جدید')
    })
  })

  it('does not call getCurrentUser when no user in store', async () => {
    useAuthStore.setState({ user: null, accessToken: null })
    const spy = vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({ data: {} })

    render(<App />)

    // Wait a tick to ensure effect has run
    await new Promise((r) => setTimeout(r, 50))
    expect(spy).not.toHaveBeenCalled()
  })

  it('does not call getCurrentUser when no accessToken', async () => {
    useAuthStore.setState({
      user: { id: 1, phone: '09121234567', full_name: 'علی', role: 'patient' },
      accessToken: null,
    })
    const spy = vi.spyOn(authApi, 'getCurrentUser').mockResolvedValue({ data: {} })

    render(<App />)

    await new Promise((r) => setTimeout(r, 50))
    expect(spy).not.toHaveBeenCalled()
  })

  it('silently ignores API errors during session refresh', async () => {
    useAuthStore.setState({
      user: { id: 1, phone: '09121234567', full_name: 'علی', role: 'patient' },
      accessToken: 'tok',
    })
    vi.spyOn(authApi, 'getCurrentUser').mockRejectedValue(new Error('network error'))

    // Should not throw
    expect(() => render(<App />)).not.toThrow()

    await new Promise((r) => setTimeout(r, 50))
    // User unchanged after silent failure
    expect(useAuthStore.getState().user.full_name).toBe('علی')
  })
})
