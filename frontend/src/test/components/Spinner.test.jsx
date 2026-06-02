import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Spinner from '../../components/Spinner'

describe('Spinner', () => {
  it('renders the spin element', () => {
    const { container } = render(<Spinner />)
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  it('forwards className to wrapper', () => {
    const { container } = render(<Spinner className="py-20" />)
    expect(container.firstChild).toHaveClass('py-20')
  })
})
