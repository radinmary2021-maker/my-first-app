import { _setNotify } from '../components/Toast'

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success' | 'error' | 'info'} [variant='info']
 * @param {number} [duration=3500]
 */
export function notify(message, variant = 'info', duration = 3500) {
  if (_setNotify) {
    _setNotify({ message, variant, duration })
  }
}
