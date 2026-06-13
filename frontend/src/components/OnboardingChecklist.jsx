/**
 * OnboardingChecklist
 *
 * Shows a progress tracker (20/40/60/80/100%) for the owner setup flow.
 * Reads from existing React Query caches — no extra API calls unless
 * the data isn't cached yet.
 *
 * Steps:
 *   1. Business created  — always done when this component renders (role=owner)
 *   2. Add provider      — providers.length > 0
 *   3. Create service    — services.length > 0
 *   4. Configure hours   — hours.length > 0
 *   5. First booking     — appointments.length > 0
 *
 * Hidden entirely once all 5 steps are done.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBusinessProviders } from '../hooks/useBusinessProviders'
import { useMyServicesList, useMyWorkingHours } from '../hooks/useDoctorSchedule'
import { useBusinessAppointments } from '../hooks/useAppointments'
import { notify } from '../utils/toast'
import { CheckIcon } from './Icon'

const STEPS = [
  {
    key:   'business',
    label: 'ایجاد کسب‌وکار',
    hint:  'کسب‌وکار شما با موفقیت ثبت شد.',
    href:  null,
  },
  {
    key:   'provider',
    label: 'افزودن ارائه‌دهنده',
    hint:  'ارائه‌دهنده کسی است که مشتریان برای او نوبت می‌گیرند.',
    href:  '/dashboard/providers',
    cta:   'افزودن →',
  },
  {
    key:   'service',
    label: 'تعریف خدمت',
    hint:  'خدماتی که ارائه می‌دهید را مشخص کنید (مثلاً: مشاوره، کوتاهی مو).',
    href:  '/dashboard/schedule',
    cta:   'تعریف خدمت →',
  },
  {
    key:   'hours',
    label: 'تنظیم ساعات کاری',
    hint:  'روزها و ساعاتی که نوبت می‌پذیرید را اضافه کنید.',
    href:  '/dashboard/schedule',
    cta:   'تنظیم ساعات →',
  },
  {
    key:   'booking',
    label: 'اولین رزرو',
    hint:  'همه چیز آماده است! لینک صفحه کسب‌وکار خود را با مشتریانتان به اشتراک بگذارید.',
    href:  null,
  },
]

function CopyLinkButton({ providerId }) {
  const [copied, setCopied] = useState(false)
  const link = providerId
    ? `${window.location.origin}/providers/${providerId}`
    : `${window.location.origin}/providers`

  function handleCopy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      notify('لینک صفحه کسب‌وکار کپی شد.', 'success')
      setTimeout(() => setCopied(false), 2500)
    }).catch(() => notify('کپی ناموفق بود.', 'error'))
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-medium text-white bg-cyan-500 hover:bg-cyan-600 px-3 py-1.5 rounded-lg transition-colors shrink-0"
      aria-label="کپی لینک صفحه کسب‌وکار"
    >
      {copied ? <><CheckIcon size={12} /> کپی شد</> : 'کپی لینک'}
    </button>
  )
}

export default function OnboardingChecklist() {
  const navigate = useNavigate()

  const { data: providers } = useBusinessProviders()
  const { data: services  } = useMyServicesList()
  const { data: hours     } = useMyWorkingHours()
  const { data: appts     } = useBusinessAppointments({})

  const firstProviderId = providers?.[0]?.id ?? null

  const done = {
    business: true,
    provider: (providers?.length ?? 0) > 0,
    service:  (services?.length  ?? 0) > 0,
    hours:    (hours?.length     ?? 0) > 0,
    booking:  (appts?.length     ?? 0) > 0,
  }

  const completedCount = Object.values(done).filter(Boolean).length
  const total          = STEPS.length
  const percent        = Math.round((completedCount / total) * 100)

  // Hide once fully complete
  if (percent === 100) return null

  // Next incomplete step index
  const nextIdx = STEPS.findIndex((s) => !done[s.key])
  const nextStep = STEPS[nextIdx]

  return (
    <div className="bg-white rounded-2xl border border-cyan-100 shadow-sm p-5 space-y-4">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800">راه‌اندازی کسب‌وکار شما</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            این مراحل را تکمیل کنید تا شروع به دریافت نوبت کنید
          </p>
        </div>
        <span className="text-sm font-bold text-cyan-600 shrink-0">{percent}٪</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-cyan-500 rounded-full transition-all duration-700"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`پیشرفت راه‌اندازی: ${percent}٪`}
        />
      </div>

      {/* Step list */}
      <ol className="space-y-1">
        {STEPS.map((step, i) => {
          const isDone = done[step.key]
          const isNext = i === nextIdx
          const isClickable = isNext && step.href
          const isBookingStep = step.key === 'booking' && isNext

          return (
            <li
              key={step.key}
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onClick={() => isClickable && navigate(step.href)}
              onKeyDown={(e) => e.key === 'Enter' && isClickable && navigate(step.href)}
              aria-label={isClickable ? `${step.label}: ${step.cta}` : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                isClickable
                  ? 'bg-cyan-50 hover:bg-cyan-100 cursor-pointer'
                  : isBookingStep
                    ? 'bg-emerald-50'
                    : isDone
                      ? ''
                      : 'opacity-50'
              }`}
            >
              {/* Step indicator */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isDone
                    ? 'bg-green-100 text-green-700'
                    : isBookingStep
                      ? 'bg-emerald-500 text-white'
                      : isNext
                        ? 'bg-cyan-500 text-white'
                        : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>

              {/* Step text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-tight ${
                  isDone
                    ? 'text-gray-400 line-through'
                    : isBookingStep
                      ? 'text-emerald-800'
                      : isNext
                        ? 'text-cyan-800'
                        : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                {isNext && (
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{step.hint}</p>
                )}
              </div>

              {/* CTA for next step */}
              {isBookingStep && (
                <CopyLinkButton providerId={firstProviderId} />
              )}
              {isClickable && !isBookingStep && (
                <span className="text-xs font-medium text-cyan-600 shrink-0">{step.cta}</span>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
