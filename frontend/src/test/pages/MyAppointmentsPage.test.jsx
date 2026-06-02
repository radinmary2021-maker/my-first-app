import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders } from '../utils'
import MyAppointmentsPage from '../../pages/patient/MyAppointmentsPage'
import * as useAppointmentsModule from '../../hooks/useAppointments'

const mockMutate = vi.fn()

function mockHooks({ appointments = [], isLoading = false, isError = false } = {}) {
  vi.spyOn(useAppointmentsModule, 'useMyAppointments').mockReturnValue({
    data: appointments,
    isLoading,
    isError,
  })
  vi.spyOn(useAppointmentsModule, 'useCancelAppointment').mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  })
}

const confirmedAppt = {
  id: 1,
  tracking_code: 'TRK001',
  doctor_name: 'دکتر احمدی',
  doctor_specialty: 'عمومی',
  date: '2026-06-10',
  start_time: '10:00',
  status: 'confirmed',
}

const cancelledAppt = {
  ...confirmedAppt,
  id: 2,
  tracking_code: 'TRK002',
  status: 'cancelled',
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MyAppointmentsPage', () => {
  it('shows loading spinner', () => {
    mockHooks({ isLoading: true })
    renderWithProviders(<MyAppointmentsPage />)
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('shows error message on fetch failure', () => {
    mockHooks({ isError: true })
    renderWithProviders(<MyAppointmentsPage />)
    expect(screen.getByText(/خطا در دریافت نوبت‌ها/)).toBeInTheDocument()
  })

  it('shows empty state when no appointments', () => {
    mockHooks({ appointments: [] })
    renderWithProviders(<MyAppointmentsPage />)
    expect(screen.getByText('هنوز نوبتی ثبت نکرده‌اید')).toBeInTheDocument()
  })

  it('renders appointment cards', () => {
    mockHooks({ appointments: [confirmedAppt] })
    renderWithProviders(<MyAppointmentsPage />)
    expect(screen.getByText('دکتر احمدی')).toBeInTheDocument()
    expect(screen.getByText('TRK001')).toBeInTheDocument()
    expect(screen.getByText('تأیید شده')).toBeInTheDocument()
  })

  it('shows cancel button only for active appointments', () => {
    mockHooks({ appointments: [confirmedAppt, cancelledAppt] })
    renderWithProviders(<MyAppointmentsPage />)
    const cancelButtons = screen.getAllByText('لغو نوبت')
    // Only the confirmed appointment should have a cancel button
    expect(cancelButtons).toHaveLength(1)
  })

  it('opens confirmation dialog on cancel click', () => {
    mockHooks({ appointments: [confirmedAppt] })
    renderWithProviders(<MyAppointmentsPage />)
    fireEvent.click(screen.getByText('لغو نوبت'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/آیا مطمئن هستید/)).toBeInTheDocument()
  })

  it('closes dialog on dismiss', () => {
    mockHooks({ appointments: [confirmedAppt] })
    renderWithProviders(<MyAppointmentsPage />)
    fireEvent.click(screen.getByText('لغو نوبت'))
    fireEvent.click(screen.getByText('انصراف'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('calls cancel mutation on confirm', () => {
    mockHooks({ appointments: [confirmedAppt] })
    renderWithProviders(<MyAppointmentsPage />)
    fireEvent.click(screen.getByText('لغو نوبت'))
    fireEvent.click(screen.getByText('بله، لغو کن'))
    expect(mockMutate).toHaveBeenCalledWith(1, expect.any(Object))
  })

  it('renders all status badges correctly', () => {
    const allStatuses = [
      { ...confirmedAppt, id: 1, status: 'pending_payment' },
      { ...confirmedAppt, id: 2, status: 'confirmed' },
      { ...confirmedAppt, id: 3, status: 'cancelled' },
      { ...confirmedAppt, id: 4, status: 'completed' },
      { ...confirmedAppt, id: 5, status: 'no_show' },
    ]
    mockHooks({ appointments: allStatuses })
    renderWithProviders(<MyAppointmentsPage />)
    expect(screen.getByText('در انتظار پرداخت')).toBeInTheDocument()
    expect(screen.getByText('تأیید شده')).toBeInTheDocument()
    expect(screen.getByText('لغو شده')).toBeInTheDocument()
    expect(screen.getByText('انجام شده')).toBeInTheDocument()
    expect(screen.getByText('غیبت')).toBeInTheDocument()
  })
})
