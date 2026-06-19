import { screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../utils'
import ProviderListPage from '../../pages/public/ProviderListPage'
import * as useDoctorsModule from '../../hooks/useDoctors'

function mockUseDoctors({ doctors = [], isLoading = false, isError = false } = {}) {
  vi.spyOn(useDoctorsModule, 'useProviders').mockReturnValue({
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

function getSidebar() {
  return document.querySelector('aside')
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ProviderListPage', () => {
  it('shows spinner and skeleton while loading', () => {
    mockUseDoctors({ isLoading: true })
    renderWithProviders(<ProviderListPage />)
    expect(document.querySelector('.animate-pulse')).toBeTruthy()
  })

  it('shows error message on fetch failure', () => {
    mockUseDoctors({ isError: true })
    renderWithProviders(<ProviderListPage />)
    expect(screen.getByText(/خطا در دریافت لیست ارائه‌دهندگان/)).toBeInTheDocument()
  })

  it('shows empty state when no doctors exist', () => {
    mockUseDoctors({ doctors: [] })
    renderWithProviders(<ProviderListPage />)
    expect(screen.getByText('نتیجه‌ای یافت نشد')).toBeInTheDocument()
  })

  it('renders all provider cards', () => {
    mockUseDoctors({ doctors: DOCTORS })
    renderWithProviders(<ProviderListPage />)
    expect(screen.getByText('دکتر رضایی')).toBeInTheDocument()
    expect(screen.getByText('دکتر احمدی')).toBeInTheDocument()
    expect(screen.getByText('دکتر صادقی')).toBeInTheDocument()
  })

  it('renders category filters in sidebar when 2+ categories exist', () => {
    mockUseDoctors({ doctors: DOCTORS })
    renderWithProviders(<ProviderListPage />)
    const sidebar = getSidebar()
    expect(sidebar).toBeTruthy()
    const sidebarScope = within(sidebar)
    expect(sidebarScope.getByText('همه')).toBeInTheDocument()
    expect(sidebarScope.getByText('قلب')).toBeInTheDocument()
    expect(sidebarScope.getByText('عمومی')).toBeInTheDocument()
  })

  it('filters providers by clicking a category in sidebar', () => {
    mockUseDoctors({ doctors: DOCTORS })
    renderWithProviders(<ProviderListPage />)
    const sidebarScope = within(getSidebar())
    fireEvent.click(sidebarScope.getByText('قلب'))
    expect(screen.getByText('دکتر رضایی')).toBeInTheDocument()
    expect(screen.getByText('دکتر صادقی')).toBeInTheDocument()
    expect(screen.queryByText('دکتر احمدی')).toBeNull()
  })

  it('clicking "همه" restores all providers after filtering', () => {
    mockUseDoctors({ doctors: DOCTORS })
    renderWithProviders(<ProviderListPage />)
    const sidebarScope = within(getSidebar())
    fireEvent.click(sidebarScope.getByText('قلب'))
    fireEvent.click(sidebarScope.getByText('همه'))
    expect(screen.getByText('دکتر رضایی')).toBeInTheDocument()
    expect(screen.getByText('دکتر احمدی')).toBeInTheDocument()
    expect(screen.getByText('دکتر صادقی')).toBeInTheDocument()
  })
})
