import { AlertCircleIcon } from './Icon'

export default function ErrorMessage({ message, className = '' }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ${className}`}
      style={{
        background:   'var(--color-danger-bg)',
        border:       '1px solid rgba(239,68,68,.2)',
        color:        'var(--color-danger)',
      }}
    >
      <AlertCircleIcon size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
