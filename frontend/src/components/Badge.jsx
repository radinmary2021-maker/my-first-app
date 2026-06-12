/**
 * Badge primitive
 *
 * Generic semantic variants:
 *   success | warning | danger | info | neutral
 *
 * Appointment status variants (match Django model field values exactly):
 *   pending_payment | confirmed | completed | cancelled | no_show
 *
 * Usage:
 *   <Badge variant="confirmed">تأیید شده</Badge>
 *   <Badge variant={appointment.status}>{STATUS_LABEL[appointment.status]}</Badge>
 */

const VARIANT_CLASS = {
  // Generic
  success:         'badge-success',
  warning:         'badge-warning',
  danger:          'badge-danger',
  error:           'badge-danger',
  info:            'badge-info',
  neutral:         'badge-neutral',

  // Appointment statuses
  pending_payment: 'badge-pending',
  pending:         'badge-pending',
  confirmed:       'badge-confirmed',
  completed:       'badge-completed',
  cancelled:       'badge-cancelled',
  no_show:         'badge-no-show',
}

export default function Badge({ children, variant = 'neutral', className = '' }) {
  return (
    <span className={`badge ${VARIANT_CLASS[variant] ?? 'badge-neutral'}${className ? ` ${className}` : ''}`}>
      {children}
    </span>
  )
}

/** Map Django status values → Persian display labels */
export const APPOINTMENT_STATUS_LABEL = {
  pending_payment: 'در انتظار پرداخت',
  confirmed:       'تأیید شده',
  completed:       'انجام شده',
  cancelled:       'لغو شده',
  no_show:         'حاضر نشد',
}
