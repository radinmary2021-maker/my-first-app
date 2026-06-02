import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ToastContainer } from '../../components/Toast'
import { notify } from '../../utils/toast'

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a toast message after notify()', () => {
    render(<ToastContainer />)
    act(() => notify('عملیات موفق', 'success'))
    expect(screen.getByText('عملیات موفق')).toBeInTheDocument()
  })

  it('removes the toast after the duration', () => {
    render(<ToastContainer />)
    act(() => notify('پیام موقت', 'info', 1000))
    expect(screen.getByText('پیام موقت')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(1100))
    expect(screen.queryByText('پیام موقت')).toBeNull()
  })

  it('applies error variant class', () => {
    render(<ToastContainer />)
    act(() => notify('خطا', 'error'))
    const el = screen.getByText('خطا')
    expect(el).toHaveClass('bg-red-600')
  })

  it('stacks multiple toasts', () => {
    render(<ToastContainer />)
    act(() => {
      notify('اول', 'info')
      notify('دوم', 'success')
    })
    expect(screen.getByText('اول')).toBeInTheDocument()
    expect(screen.getByText('دوم')).toBeInTheDocument()
  })
})
