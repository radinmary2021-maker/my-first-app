import { screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { renderWithProviders } from '../utils'
import PaymentResultPage from '../../pages/patient/PaymentResultPage'

describe('PaymentResultPage', () => {
  it('shows success UI when status=success', () => {
    renderWithProviders(<PaymentResultPage />, {
      route: '/payment/result?status=success&tracking_code=ABC123&ref_id=REF456',
    })
    expect(screen.getByText('پرداخت موفق')).toBeInTheDocument()
    expect(screen.getByText('ABC123')).toBeInTheDocument()
    expect(screen.getByText('REF456')).toBeInTheDocument()
  })

  it('shows failure UI when status is not success', () => {
    renderWithProviders(<PaymentResultPage />, {
      route: '/payment/result?status=failed',
    })
    expect(screen.getByText('پرداخت ناموفق')).toBeInTheDocument()
  })

  it('shows unknown state UI when status param is missing', () => {
    renderWithProviders(<PaymentResultPage />, {
      route: '/payment/result',
    })
    expect(screen.getByText('نتیجه نامشخص')).toBeInTheDocument()
  })

  it('does not render tracking_code section when missing', () => {
    renderWithProviders(<PaymentResultPage />, {
      route: '/payment/result?status=success',
    })
    expect(screen.getByText('پرداخت موفق')).toBeInTheDocument()
    expect(screen.queryByText('کد پیگیری')).toBeNull()
  })
})
