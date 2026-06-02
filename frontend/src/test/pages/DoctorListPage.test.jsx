import { screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../utils'
import DoctorListPage from '../../pages/public/DoctorListPage'
import * as useDoctorsModule from '../../hooks/useDoctors'

function mockUseDoctors({ doctors = [], isLoading = false, isError = false } = {}) {
  vi.spyOn(useDoctorsModule, 'useDoctors').mockReturnValue({
    data: doctors,
    isLoading,
    isError,
    error: null,
  })
}

const DOCTORS = [
  { id: 1, full_name: 'دکتر رضایی', specialty: 'قلب', visit_duration: 20, consultation_fee: '500000', available_weekdays: [0, 1] },
  { id: 2, full_name: 'دکتر احمدی', specialty: 'عمومی', visit_duration: 15, consultation_fee: '300000', available_weekdays: [2] },
  { id: 3, full_name: 'دکتر صادقی', specialty: 'قلب', visit_duration: 30, consultation_fee: '700000', available_weekdays: [3] },
]

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DoctorListPage', () => {
  it('shows spinner and skeleton while loading', () => {
    mockUseDoctors({ isLoading: true })
    renderWithProviders(<DoctorListPage />)
    expect(document.querySelector('.animate-spin')).toBeTruthy()
    expect(document.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('shows error message on fetch failure', () => {
    mockUseDoctors({ isError: true })
    renderWithProviders(<DoctorListPage />)
    expect(screen.getByText(/خطا در دریافت لیست پزشکان/)).toBeInTheDocument()
  })

  it('shows empty state when no doctors exist', () => {
    mockUseDoctors({ doctors: [] })
    renderWithProviders(<DoctorListPage />)
    expect(screen.getByText('هیچ پزشکی ثبت نشده است')).toBeInTheDocument()
  })

  it('renders all doctor cards', () => {
    mockUseDoctors({ doctors: DOCTORS })
    renderWithProviders(<DoctorListPage />)
    expect(screen.getByText('دکتر رضایی')).toBeInTheDocument()
    expect(screen.getByText('دکتر احمدی')).toBeInTheDocument()
    expect(screen.getByText('دکتر صادقی')).toBeInTheDocument()
  })

  it('renders specialty filter chips when 2+ specialties exist', () => {
    mockUseDoctors({ doctors: DOCTORS })
    renderWithProviders(<DoctorListPage />)
    expect(screen.getByRole('group', { name: 'فیلتر تخصص' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'همه' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'قلب' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'عمومی' })).toBeInTheDocument()
  })

  it('does not render filter chips when only one specialty', () => {
    const singleSpecialty = DOCTORS.filter((d) => d.specialty === 'قلب')
    mockUseDoctors({ doctors: singleSpecialty })
    renderWithProviders(<DoctorListPage />)
    expect(screen.queryByRole('group', { name: 'فیلتر تخصص' })).toBeNull()
  })

  it('"همه" chip is active by default', () => {
    mockUseDoctors({ doctors: DOCTORS })
    renderWithProviders(<DoctorListPage />)
    expect(screen.getByRole('button', { name: 'همه' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('filters doctors by selected specialty', () => {
    mockUseDoctors({ doctors: DOCTORS })
    renderWithProviders(<DoctorListPage />)
    fireEvent.click(screen.getByRole('button', { name: 'قلب' }))
    expect(screen.getByText('دکتر رضایی')).toBeInTheDocument()
    expect(screen.getByText('دکتر صادقی')).toBeInTheDocument()
    expect(screen.queryByText('دکتر احمدی')).toBeNull()
  })

  it('marks selected specialty chip as active and deactivates others', () => {
    mockUseDoctors({ doctors: DOCTORS })
    renderWithProviders(<DoctorListPage />)
    fireEvent.click(screen.getByRole('button', { name: 'قلب' }))
    expect(screen.getByRole('button', { name: 'قلب' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'همه' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'عمومی' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking "همه" chip restores all doctors after filtering', () => {
    mockUseDoctors({ doctors: DOCTORS })
    renderWithProviders(<DoctorListPage />)
    fireEvent.click(screen.getByRole('button', { name: 'قلب' }))
    fireEvent.click(screen.getByRole('button', { name: 'همه' }))
    expect(screen.getByText('دکتر رضایی')).toBeInTheDocument()
    expect(screen.getByText('دکتر احمدی')).toBeInTheDocument()
    expect(screen.getByText('دکتر صادقی')).toBeInTheDocument()
  })
})
