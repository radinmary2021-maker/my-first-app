// Shared vi.fn() factories reused across test files
import { vi } from 'vitest'

export const mockGetMyAppointments = vi.fn()
export const mockCancelAppointment = vi.fn()
export const mockGetDoctors = vi.fn()
