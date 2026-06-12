import { forwardRef } from 'react'

/**
 * Input primitive
 *
 * label:     renders a <label> above the input
 * error:     turns border red and shows error text below
 * hint:      shows helper text below (hidden when error is present)
 * iconStart: icon rendered on the right side (RTL inline-start)
 * iconEnd:   icon rendered on the left side (RTL inline-end)
 * forceLtr:  sets dir="ltr" + text-left — required for phone/OTP fields
 *            inside RTL forms so digits don't get visually reversed
 *
 * forwardRef allows parent to call inputRef.current?.focus() for
 * focus management (e.g. auto-focus after OTP error).
 */
const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    iconStart,
    iconEnd,
    forceLtr  = false,
    className = '',
    id,
    ...props
  },
  ref
) {
  const inputId = id ?? (typeof label === 'string' ? label.replace(/\s+/g, '-').toLowerCase() : undefined)

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {/* iconStart sits on the right (RTL inline-start) */}
        {iconStart && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {iconStart}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          dir={forceLtr ? 'ltr' : undefined}
          className={[
            'input',
            iconStart ? 'pr-10'       : '',
            iconEnd   ? 'pl-10'       : '',
            error     ? 'input-error' : '',
            forceLtr  ? 'text-left tracking-widest' : '',
            className,
          ].filter(Boolean).join(' ')}
          {...props}
        />

        {/* iconEnd sits on the left (RTL inline-end) */}
        {iconEnd && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {iconEnd}
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {hint}
        </p>
      )}
    </div>
  )
})

export default Input
