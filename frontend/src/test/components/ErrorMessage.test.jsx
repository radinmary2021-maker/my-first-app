import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ErrorMessage from '../../components/ErrorMessage'

describe('ErrorMessage', () => {
  it('renders the message text', () => {
    render(<ErrorMessage message="خطایی رخ داد" />)
    expect(screen.getByText('خطایی رخ داد')).toBeInTheDocument()
  })

  it('renders nothing when message is empty', () => {
    const { container } = render(<ErrorMessage message="" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when message is undefined', () => {
    const { container } = render(<ErrorMessage />)
    expect(container.firstChild).toBeNull()
  })
})
