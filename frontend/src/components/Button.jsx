import Spinner from './Spinner'

/**
 * Button primitive
 *
 * variant: primary | secondary | ghost | danger
 * size:    sm | md | lg
 * loading: shows inline Spinner + sets aria-disabled (prevents double-submit)
 * as:      render as a different element (e.g. as={Link} for router links)
 *
 * Gap between spinner/icon and text is handled by CSS gap-2 on .btn,
 * never by margin — so it works correctly in RTL layouts.
 */
export default function Button({
  children,
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  fullWidth = false,
  className = '',
  as: Tag   = 'button',
  type,
  ...props
}) {
  const isDisabled = loading || props.disabled

  return (
    <Tag
      type={Tag === 'button' ? (type ?? 'button') : undefined}
      className={`btn btn-${variant} btn-${size}${fullWidth ? ' w-full' : ''}${className ? ` ${className}` : ''}`}
      disabled={Tag === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="xs" />}
      {children}
    </Tag>
  )
}
