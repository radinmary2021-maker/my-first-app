import { _setNotify } from '../components/Toast'

export function notify(message, variant = 'info', duration = 3500) {
  _setNotify?.({ message, variant, duration })
}
