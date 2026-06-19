/**
 * DashboardPage tests
 *
 * Key patterns:
 *  - vi.mock at module level (hoisted) so React Query's real useQuery is NEVER invoked
 *  - NO vi.restoreAllMocks() in afterEach — that would restore real hooks and break React's
 *    hook-count invariant across test boundary (see ProvidersPage.test.jsx for full explanation)
 *  - Both hooks called unconditionally; `enabled` flag gates actual fetching
 */

import { screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders } from '../utils'
import DashboardPage from '../../pages/doctor/DashboardPage'
import {
  useProviderAppointments,
  useBusinessAppointments,
  useConfirmAppointment,
  useCompleteAppointment,
  useNoShowAppointment,
  useProviderCancelAppointment,
} from '../../hooks/useAppointments'
import { useAuthStore } from '../../store/authStore'
import { toJalali } from '../../utils/jalali'
import { ToastContainer } from '../../components/Toast'

// ── Must be at module level so Vitest can hoist it before imports ─────────────
vi.mock('../../hooks/useAppointments')

// OnboardingChecklist (rendered inside DashboardPage for owners) uses these hooks.
// Mock them here so the checklist renders cleanly without network calls.
vi.mock('../../hooks/useBusinessProviders', () => ({
  useBusinessProviders: vi.fn().mockReturnValue({ data: [], isLoading: false, isError: false }),
}))
vi.mock('../../hooks/useDoctorSchedule', () => ({
  useMyServicesList:  vi.fn().mockReturnValue({ data: [], isLoading: false, isError: false }),
  useMyWorkingHours:  vi.fn().mockReturnValue({ data: [], isLoading: false, isError: false }),
  useMyTimeOffs:      vi.fn().mockReturnValue({ data: [], isLoading: false, isError: false }),
  useCreateService:   vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteService:   vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useCreateWorkingHours: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteWorkingHours: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useCreateTimeOff:   vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useDeleteTimeOff:   vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
}))

// ── Date helpers ───────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0]

// ── Fixtures ──────────────────────────────────────────────────────────────────
const confirmedToday = {
  id: 1,
  tracking_code: 'TRK001',
  customer_name: 'علی محمدی',
  customer_phone: '09100000001',
  provider_name: 'دکتر احمدی',
  service_name: 'ویزیت عمومی',
  date: TODAY,
  start_time: '10:00',
  end_time: '10:30',
  status: 'confirmed',
  total_price: 100000,
  deposit_paid: 0,
  notes: '',
}

const pendingToday = {
  ...confirmedToday,
  id: 2,
  tracking_code: 'TRK002',
  customer_name: 'رضا کریمی',
  customer_phone: '09100000002',
  provider_name: 'دکتر رضایی',
  service_name: '',
  status: 'pending',
}

const completedToday = {
  ...confirmedToday,
  id: 3,
  tracking_code: 'TRK003',
  customer_name: 'فاطمه موسوی',
  customer_phone: '09100000003',
  provider_name: 'دکتر احمدی',
  service_name: 'مشاوره',
  status: 'completed',
}

const cancelledAppt = {
  ...confirmedToday,
  id: 4,
  tracking_code: 'TRK004',
  customer_name: 'حسین جعفری',
  customer_phone: '09100000004',
  date: TODAY,
  status: 'cancelled',
}

const confirmedOtherDate = {
  ...confirmedToday,
  id: 5,
  tracking_code: 'TRK005',
  date: '2020-01-01', // far in the past → should NOT count in today metrics
}

// ── Mock helpers ──────────────────────────────────────────────────────────────
const noopMutate = vi.fn()

function mockHooks({
  businessAppts = [],
  providerAppts = [],
  isLoading     = false,
  isError       = false,
  confirmMutate   = noopMutate,
  completeMutate  = noopMutate,
  noShowMutate    = noopMutate,
  cancelMutate    = noopMutate,
} = {}) {
  useBusinessAppointments.mockReturnValue({ data: businessAppts, isLoading, isError })
  useProviderAppointments.mockReturnValue({ data: providerAppts, isLoading, isError })
  useConfirmAppointment.mockReturnValue({ mutate: confirmMutate, isPending: false })
  useCompleteAppointment.mockReturnValue({ mutate: completeMutate, isPending: false })
  useNoShowAppointment.mockReturnValue({ mutate: noShowMutate, isPending: false })
  useProviderCancelAppointment.mockReturnValue({ mutate: cancelMutate, isPending: false })
}

function setOwner() {
  useAuthStore.setState({
    user: { role: 'owner', full_name: 'مالک تست', phone: '09120000000' },
    accessToken: 'tok',
  })
}

function setProvider() {
  useAuthStore.setState({
    user: { role: 'provider', full_name: 'ارائه‌دهنده تست', phone: '09121111111' },
    accessToken: 'tok',
  })
}

function renderPage() {
  return renderWithProviders(
    <>
      <DashboardPage />
      <ToastContainer />
    </>
  )
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
beforeEach(() => {
  vi.clearAllMocks()
  mockHooks()
})

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null })
})

// ═════════════════════════════════════════════════════════════════════════════
// 1. Page header / title
// ═════════════════════════════════════════════════════════════════════════════
describe('page header', () => {
  it('shows provider title for provider role', () => {
    setProvider()
    renderPage()
    expect(screen.getByText('داشبورد ارائه‌دهنده')).toBeInTheDocument()
  })

  it('shows owner title for owner role', () => {
    setOwner()
    renderPage()
    expect(screen.getByText('داشبورد کسب‌وکار')).toBeInTheDocument()
  })

  it('shows today active count subtitle for provider when > 0', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday, pendingToday] })
    renderPage()
    expect(screen.getByText(/نوبت فعال امروز/)).toBeInTheDocument()
    expect(screen.getByText(/2 نوبت فعال امروز/)).toBeInTheDocument()
  })

  it('does not show subtitle for provider when zero active today', () => {
    setProvider()
    mockHooks({ providerAppts: [completedToday] }) // completed doesn't count
    renderPage()
    expect(screen.queryByText(/نوبت فعال امروز/)).not.toBeInTheDocument()
  })

  it('does not show provider subtitle for owner role', () => {
    setOwner()
    mockHooks({ businessAppts: [confirmedToday, pendingToday] })
    renderPage()
    expect(screen.queryByText(/نوبت فعال امروز/)).not.toBeInTheDocument()
  })

  it('renders schedule management button', () => {
    setProvider()
    renderPage()
    expect(screen.getByRole('button', { name: 'مدیریت برنامه' })).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 2. Hook selection — owner uses business endpoint, provider uses provider endpoint
// ═════════════════════════════════════════════════════════════════════════════
describe('hook selection', () => {
  it('owner: calls useBusinessAppointments with enabled: true', () => {
    setOwner()
    renderPage()
    expect(useBusinessAppointments).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: true })
    )
  })

  it('owner: calls useProviderAppointments with enabled: false', () => {
    setOwner()
    renderPage()
    expect(useProviderAppointments).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: false })
    )
  })

  it('provider: calls useProviderAppointments with enabled: true', () => {
    setProvider()
    renderPage()
    expect(useProviderAppointments).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: true })
    )
  })

  it('provider: calls useBusinessAppointments with enabled: false', () => {
    setProvider()
    renderPage()
    expect(useBusinessAppointments).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ enabled: false })
    )
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 3. Owner metrics bar
// ═════════════════════════════════════════════════════════════════════════════
describe('owner metrics bar', () => {
  it('renders metrics bar for owner', () => {
    setOwner()
    mockHooks({ businessAppts: [] })
    renderPage()
    expect(screen.getByTestId('owner-metrics')).toBeInTheDocument()
  })

  it('does not render metrics bar for provider', () => {
    setProvider()
    mockHooks({ providerAppts: [] })
    renderPage()
    expect(screen.queryByTestId('owner-metrics')).not.toBeInTheDocument()
  })

  it('shows correct counts: active=2, pending=1, confirmed=1, completed=1', () => {
    setOwner()
    mockHooks({ businessAppts: [confirmedToday, pendingToday, completedToday] })
    renderPage()

    const metrics = screen.getByTestId('owner-metrics')

    // active today = confirmed + pending = 2
    expect(within(metrics).getByText('2')).toBeInTheDocument()
    // pending = 1, confirmed = 1, completed = 1
    const ones = within(metrics).getAllByText('1')
    expect(ones.length).toBe(3)
  })

  it('does not count appointments from other dates', () => {
    setOwner()
    mockHooks({ businessAppts: [confirmedOtherDate] })
    renderPage()

    const metrics = screen.getByTestId('owner-metrics')
    // all counts should be 0
    const zeros = within(metrics).getAllByText('0')
    expect(zeros.length).toBe(4)
  })

  it('shows metric labels', () => {
    setOwner()
    mockHooks({ businessAppts: [] })
    renderPage()

    const metrics = screen.getByTestId('owner-metrics')
    // Scope all metric label checks to the metrics container to avoid ambiguity
    // with filter buttons and OnboardingChecklist text
    expect(within(metrics).getByText('فعال امروز')).toBeInTheDocument()
    expect(within(metrics).getByText('در انتظار')).toBeInTheDocument()
    expect(within(metrics).getByText('تأیید شده')).toBeInTheDocument()
    expect(within(metrics).getByText('انجام شده')).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 4. Loading and error states
// ═════════════════════════════════════════════════════════════════════════════
describe('loading and error states', () => {
  it('shows spinner while loading (provider)', () => {
    setProvider()
    mockHooks({ isLoading: true })
    renderPage()
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('shows spinner while loading (owner)', () => {
    setOwner()
    mockHooks({ isLoading: true })
    renderPage()
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('shows error message on error', () => {
    setProvider()
    mockHooks({ isError: true })
    renderPage()
    expect(screen.getByText('مشکلی در دریافت نوبت‌ها پیش آمد.')).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 5. Empty states
// ═════════════════════════════════════════════════════════════════════════════
describe('empty states', () => {
  it('owner: shows owner-specific empty message', () => {
    setOwner()
    mockHooks({ businessAppts: [] })
    renderPage()
    expect(screen.getByText('هنوز نوبتی ثبت نشده است.')).toBeInTheDocument()
  })

  it('owner: shows booking link guidance text', () => {
    setOwner()
    mockHooks({ businessAppts: [] })
    renderPage()
    expect(screen.getByText(/لینک صفحه کسب‌وکار/)).toBeInTheDocument()
  })

  it('provider: shows generic empty message', () => {
    setProvider()
    mockHooks({ providerAppts: [] })
    renderPage()
    expect(screen.getByText('نوبتی یافت نشد.')).toBeInTheDocument()
  })

  it('provider: does NOT show owner guidance text', () => {
    setProvider()
    mockHooks({ providerAppts: [] })
    renderPage()
    expect(screen.queryByText(/لینک رزرو/)).not.toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 6. Appointment list rendering
// ═════════════════════════════════════════════════════════════════════════════
describe('appointment list rendering', () => {
  it('renders customer name and phone', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] })
    renderPage()
    expect(screen.getByText('علی محمدی')).toBeInTheDocument()
    expect(screen.getByText('09100000001')).toBeInTheDocument()
  })

  it('owner: shows provider_name chip for each appointment', () => {
    setOwner()
    mockHooks({ businessAppts: [confirmedToday, pendingToday] })
    renderPage()
    expect(screen.getByText(/ارائه‌دهنده: دکتر احمدی/)).toBeInTheDocument()
    expect(screen.getByText(/ارائه‌دهنده: دکتر رضایی/)).toBeInTheDocument()
  })

  it('provider: does NOT show provider_name chip', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] })
    renderPage()
    expect(screen.queryByText(/ارائه‌دهنده: دکتر احمدی/)).not.toBeInTheDocument()
  })

  it('shows service_name in the info grid when present', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] }) // service_name = 'ویزیت عمومی'
    renderPage()
    expect(screen.getByText('ویزیت عمومی')).toBeInTheDocument()
  })

  it('shows tracking_code when service_name is absent', () => {
    setProvider()
    const noService = { ...confirmedToday, service_name: '' }
    mockHooks({ providerAppts: [noService] })
    renderPage()
    expect(screen.getByText('TRK001')).toBeInTheDocument()
  })

  it('shows date and time for each appointment', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] })
    renderPage()
    expect(screen.getByText(toJalali(TODAY))).toBeInTheDocument()
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
  })

  it('shows status badge with correct label', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] })
    renderPage()
    // "تأیید شده" also appears in the status filter bar; scope to the appointment row
    const row = screen.getByTestId('appointment-row')
    expect(within(row).getByText('تأیید شده')).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 7. Action buttons visibility
// ═════════════════════════════════════════════════════════════════════════════
describe('action buttons visibility', () => {
  it('confirmed appointment shows انجام شد, غیبت, لغو buttons', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] })
    renderPage()
    // "غیبت" also exists as a status filter button — scope to the appointment row
    const row = screen.getByTestId('appointment-row')
    expect(within(row).getByRole('button', { name: 'انجام شد' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'غیبت' })).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'لغو' })).toBeInTheDocument()
  })

  it('pending appointment does NOT show action buttons', () => {
    setProvider()
    mockHooks({ providerAppts: [pendingToday] })
    renderPage()
    expect(screen.queryByRole('button', { name: 'انجام شد' })).not.toBeInTheDocument()
  })

  it('completed appointment does NOT show action buttons', () => {
    setProvider()
    mockHooks({ providerAppts: [completedToday] })
    renderPage()
    expect(screen.queryByRole('button', { name: 'انجام شد' })).not.toBeInTheDocument()
  })

  it('cancelled appointment does NOT show action buttons', () => {
    setProvider()
    mockHooks({ providerAppts: [cancelledAppt] })
    renderPage()
    expect(screen.queryByRole('button', { name: 'انجام شد' })).not.toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 8. Confirm dialog
// ═════════════════════════════════════════════════════════════════════════════
describe('confirm dialog', () => {
  it('clicking انجام شد opens confirm dialog', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'انجام شد' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('آیا این نوبت به پایان رسیده؟')).toBeInTheDocument()
  })

  it('clicking غیبت opens confirm dialog with correct question', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] })
    renderPage()
    // "غیبت" also appears as a status filter button — scope click to the appointment row
    const row = screen.getByTestId('appointment-row')
    fireEvent.click(within(row).getByRole('button', { name: 'غیبت' }))
    expect(screen.getByText('آیا مشتری غیبت کرده؟')).toBeInTheDocument()
  })

  it('clicking لغو opens confirm dialog with correct question', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'لغو' }))
    expect(screen.getByText('آیا می‌خواهید این نوبت را لغو کنید؟')).toBeInTheDocument()
  })

  it('clicking انصراف closes the dialog', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'انجام شد' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'انصراف' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('dialog has aria-label for accessibility', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday] })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'انجام شد' }))
    expect(screen.getByRole('dialog', { name: 'تأیید عملیات' })).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 9. Action execution and feedback
// ═════════════════════════════════════════════════════════════════════════════
describe('action execution', () => {
  it('complete: calls completeMutate with appointment id', () => {
    const completeMutate = vi.fn()
    setProvider()
    mockHooks({ providerAppts: [confirmedToday], completeMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'انجام شد' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'تأیید' }))
    expect(completeMutate).toHaveBeenCalledWith(1, expect.objectContaining({ onSuccess: expect.any(Function) }))
  })

  it('no_show: calls noShowMutate with appointment id', () => {
    const noShowMutate = vi.fn()
    setProvider()
    mockHooks({ providerAppts: [confirmedToday], noShowMutate })
    renderPage()
    const row = screen.getByTestId('appointment-row')
    fireEvent.click(within(row).getByRole('button', { name: 'غیبت' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'تأیید' }))
    expect(noShowMutate).toHaveBeenCalledWith(1, expect.objectContaining({ onSuccess: expect.any(Function) }))
  })

  it('cancel: calls cancelMutate with appointment id', () => {
    const cancelMutate = vi.fn()
    setProvider()
    mockHooks({ providerAppts: [confirmedToday], cancelMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'لغو' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'تأیید' }))
    expect(cancelMutate).toHaveBeenCalledWith(1, expect.objectContaining({ onSuccess: expect.any(Function) }))
  })

  it('complete: shows success toast and closes dialog', () => {
    const completeMutate = vi.fn((_id, { onSuccess }) => onSuccess())
    setProvider()
    mockHooks({ providerAppts: [confirmedToday], completeMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'انجام شد' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'تأیید' }))
    expect(screen.getByText('نوبت تکمیل شد.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('no_show: shows success toast and closes dialog', () => {
    const noShowMutate = vi.fn((_id, { onSuccess }) => onSuccess())
    setProvider()
    mockHooks({ providerAppts: [confirmedToday], noShowMutate })
    renderPage()
    const row = screen.getByTestId('appointment-row')
    fireEvent.click(within(row).getByRole('button', { name: 'غیبت' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'تأیید' }))
    expect(screen.getByText('غیبت ثبت شد.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cancel: shows success toast and closes dialog', () => {
    const cancelMutate = vi.fn((_id, { onSuccess }) => onSuccess())
    setProvider()
    mockHooks({ providerAppts: [confirmedToday], cancelMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'لغو' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'تأیید' }))
    expect(screen.getByText('نوبت لغو شد.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('on error: shows error toast and closes dialog', () => {
    const err = { response: { data: { error: 'عملیات ناموفق بود.' } } }
    const completeMutate = vi.fn((_id, { onError }) => onError(err))
    setProvider()
    mockHooks({ providerAppts: [confirmedToday], completeMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'انجام شد' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'تأیید' }))
    expect(screen.getByText('عملیات ناموفق بود.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('on error without message: shows fallback error toast', () => {
    const completeMutate = vi.fn((_id, { onError }) => onError({}))
    setProvider()
    mockHooks({ providerAppts: [confirmedToday], completeMutate })
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'انجام شد' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'تأیید' }))
    expect(screen.getByText('خطایی رخ داد.')).toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 10. Filter UI
// ═════════════════════════════════════════════════════════════════════════════
describe('filter UI', () => {
  it('renders all status filter buttons', () => {
    setProvider()
    renderPage()
    expect(screen.getByRole('button', { name: 'همه' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'تأیید شده' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'در انتظار' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'انجام شده' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'لغو شده' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'غیبت' })).toBeInTheDocument()
  })

  it('clicking a status filter re-queries with that status', () => {
    setProvider()
    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'تأیید شده' }))
    expect(useProviderAppointments).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'confirmed' }),
      expect.any(Object)
    )
  })

  it('shows date filter input', () => {
    setProvider()
    renderPage()
    expect(screen.getByLabelText('فیلتر بر اساس تاریخ')).toBeInTheDocument()
  })

  it('shows clear date button when date is set', () => {
    setProvider()
    renderPage()
    const dateInput = screen.getByLabelText('فیلتر بر اساس تاریخ')
    fireEvent.change(dateInput, { target: { value: '2026-06-09' } })
    expect(screen.getByRole('button', { name: 'پاک کردن' })).toBeInTheDocument()
  })

  it('clicking clear date button removes the date filter', () => {
    setProvider()
    renderPage()
    const dateInput = screen.getByLabelText('فیلتر بر اساس تاریخ')
    fireEvent.change(dateInput, { target: { value: '2026-06-09' } })
    fireEvent.click(screen.getByRole('button', { name: 'پاک کردن' }))
    expect(screen.queryByRole('button', { name: 'پاک کردن' })).not.toBeInTheDocument()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 11. Multiple appointments
// ═════════════════════════════════════════════════════════════════════════════
describe('multiple appointments', () => {
  it('renders all appointments in the list', () => {
    setOwner()
    mockHooks({ businessAppts: [confirmedToday, pendingToday, completedToday] })
    renderPage()
    expect(screen.getByText('علی محمدی')).toBeInTheDocument()
    expect(screen.getByText('رضا کریمی')).toBeInTheDocument()
    expect(screen.getByText('فاطمه موسوی')).toBeInTheDocument()
  })

  it('only confirmed appointments in list show action buttons', () => {
    setProvider()
    mockHooks({ providerAppts: [confirmedToday, pendingToday, completedToday] })
    renderPage()
    // Only one "انجام شد" button — from confirmedToday
    expect(screen.getAllByRole('button', { name: 'انجام شد' })).toHaveLength(1)
  })
})
