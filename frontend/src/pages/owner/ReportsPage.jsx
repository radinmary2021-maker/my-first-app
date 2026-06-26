import { useState } from 'react'
import OwnerLayout from '../../layouts/OwnerLayout'
import Spinner from '../../components/Spinner'
import ErrorMessage from '../../components/ErrorMessage'
import Button from '../../components/Button'
import Input from '../../components/Input'
import {
  BarChart2Icon,
  WalletIcon,
  CalendarIcon,
  XCircleIcon,
  RefreshCwIcon,
} from '../../components/Icon'
import { toJalali, getJalali, toFa } from '../../utils/jalali'
import { useReportSummary } from '../../hooks/useReports'

const PERIODS = [
  { value: 'this_month', label: 'این ماه' },
  { value: 'last_month', label: 'ماه گذشته' },
  { value: 'this_week',  label: 'این هفته' },
  { value: 'custom',     label: 'بازه دلخواه' },
]

const STATUS_LABEL = {
  completed: 'انجام شده',
  confirmed: 'تأیید شده',
  pending:   'در انتظار',
  cancelled: 'لغو شده',
  no_show:   'غیبت',
}

const STATUS_COLOR_VAR = {
  completed: '--color-success',
  confirmed: '--color-brand',
  pending:   '--color-warning',
  cancelled: '--color-danger',
  no_show:   '--color-text-tertiary',
}

function formatCurrency(n) {
  return `${(n ?? 0).toLocaleString('fa-IR')} تومان`
}

function formatNum(n) {
  return (n ?? 0).toLocaleString('fa-IR')
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, icon, colorVar, bgVar }) {
  return (
    <div
      className="card px-4 py-3"
      style={{ backgroundColor: `var(${bgVar})`, borderColor: 'transparent' }}
    >
      <div className="flex items-center gap-2 mb-2" style={{ color: `var(${colorVar})` }}>
        {icon}
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </span>
      </div>
      <p className="text-xl font-bold leading-tight" style={{ color: `var(${colorVar})` }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary)' }}>{sub}</p>
      )}
    </div>
  )
}

function StatusBreakdown({ byStatus, total }) {
  if (!total) return null
  const entries = Object.entries(byStatus).sort((a, b) => b[1] - a[1])
  return (
    <div className="card p-4 space-y-3">
      <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        توزیع وضعیت نوبت‌ها
      </h2>
      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden h-3" style={{ gap: 1 }}>
        {entries.map(([st, cnt]) => (
          <div
            key={st}
            style={{
              width: `${(cnt / total) * 100}%`,
              backgroundColor: `var(${STATUS_COLOR_VAR[st] ?? '--color-text-tertiary'})`,
              opacity: 0.8,
            }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {entries.map(([st, cnt]) => (
          <div key={st} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: `var(${STATUS_COLOR_VAR[st] ?? '--color-text-tertiary'})` }}
            />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {STATUS_LABEL[st] ?? st}
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {formatNum(cnt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DailyChart({ data }) {
  if (!data || data.length === 0) return null

  const W = 600
  const H = 200
  const PL = 36   // padding left (Y labels)
  const PR = 8
  const PT = 12
  const PB = 40   // padding bottom (X labels)
  const innerW = W - PL - PR
  const innerH = H - PT - PB

  const maxCount = Math.max(...data.map(d => d.count), 1)
  const n = data.length
  const gap = n > 14 ? 2 : 4
  const barW = Math.max(6, (innerW - gap * (n - 1)) / n)

  const yGrids = [0, 0.25, 0.5, 0.75, 1].filter(r => Math.round(r * maxCount) !== Math.round((r - 0.25) * maxCount) || r === 0)

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ minWidth: Math.max(300, n * (barW + gap) + PL + PR) }}
        className="w-full"
        aria-label="نمودار نوبت‌های روزانه"
      >
        {/* Y gridlines */}
        {[0, 0.5, 1].map(ratio => {
          const y = PT + (1 - ratio) * innerH
          return (
            <g key={ratio}>
              <line
                x1={PL} y1={y} x2={W - PR} y2={y}
                stroke="var(--color-border)" strokeWidth={0.5}
              />
              <text
                x={PL - 4} y={y + 4}
                textAnchor="end" fontSize={9}
                fill="var(--color-text-tertiary)"
              >
                {toFa(Math.round(ratio * maxCount))}
              </text>
            </g>
          )
        })}

        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.count / maxCount) * innerH
          const x = PL + i * (barW + gap)
          const y = PT + innerH - barH

          // Jalali day label
          const dt = new Date(d.date + 'T12:00:00')
          const { jd } = getJalali(dt)
          const label = toFa(jd)

          const showLabel = n <= 20 || i % Math.ceil(n / 20) === 0

          return (
            <g key={d.date}>
              <rect
                x={x} y={barH > 0 ? y : PT + innerH - 2}
                width={barW} height={Math.max(barH, 2)}
                rx={2}
                fill="var(--color-brand)"
                opacity={0.8}
              />
              {/* Count on top of bar */}
              {d.count > 0 && barH > 18 && (
                <text
                  x={x + barW / 2} y={y - 2}
                  textAnchor="middle" fontSize={8}
                  fill="var(--color-brand)"
                >
                  {toFa(d.count)}
                </text>
              )}
              {/* X label */}
              {showLabel && (
                <text
                  x={x + barW / 2} y={H - 4}
                  textAnchor="middle" fontSize={9}
                  fill="var(--color-text-tertiary)"
                >
                  {label}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function TopServicesTable({ services }) {
  const maxCount = Math.max(...services.map(s => s.count), 1)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th className="text-right pb-2 font-medium text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              خدمت
            </th>
            <th className="text-center pb-2 font-medium text-xs w-24" style={{ color: 'var(--color-text-tertiary)' }}>
              تعداد
            </th>
            <th className="text-left pb-2 font-medium text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              درآمد (تومان)
            </th>
          </tr>
        </thead>
        <tbody>
          {services.map((s, i) => (
            <tr
              key={i}
              style={{ borderBottom: '1px solid var(--color-border)' }}
              className="transition-colors"
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,200,0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <td className="py-2.5 pr-0 font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {s.name}
              </td>
              <td className="py-2.5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${(s.count / maxCount) * 60}px`,
                      backgroundColor: 'var(--color-brand)',
                      opacity: 0.5,
                    }}
                  />
                  <span className="font-bold text-xs" style={{ color: 'var(--color-brand)' }}>
                    {formatNum(s.count)}
                  </span>
                </div>
              </td>
              <td className="py-2.5 pl-0 text-left font-mono text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {s.revenue > 0 ? formatNum(s.revenue) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [period, setPeriod]       = useState('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo]   = useState('')

  const params = { period }
  if (period === 'custom' && customFrom && customTo) {
    params.from = customFrom
    params.to   = customTo
  }

  const enabled = period !== 'custom' || (!!customFrom && !!customTo)
  const { data, isLoading, isError, refetch } = useReportSummary(params, { enabled })

  const hasData = data && data.appointments.total > 0

  return (
    <OwnerLayout
      title="گزارش‌ها"
      subtitle={data ? `${toJalali(data.from)} — ${toJalali(data.to)}` : 'عملکرد کسب‌وکار شما'}
      headerAction={
        <div className="flex rounded-xl p-1" style={{ background: '#1A2A3E', border: '1px solid rgba(0,212,200,0.07)' }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={period === p.value
                ? { background: 'rgba(0,212,200,0.12)', color: '#00D4C8', fontWeight: 700 }
                : { color: '#4A6E8A' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="space-y-6"  dir="rtl">

        {/* Custom date range inputs */}
        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>از</span>
              <Input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                forceLtr
                className="text-sm py-1.5"
                aria-label="تاریخ شروع"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>تا</span>
              <Input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                forceLtr
                className="text-sm py-1.5"
                aria-label="تاریخ پایان"
              />
            </div>
          </div>
        )}

        {/* Custom period guide */}
        {period === 'custom' && !enabled && (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            تاریخ شروع و پایان را انتخاب کنید.
          </p>
        )}

        {/* Loading */}
        {isLoading && <Spinner className="py-20" />}

        {/* Error */}
        {isError && (
          <div className="space-y-3">
            <ErrorMessage message="مشکلی در دریافت گزارش پیش آمد." />
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCwIcon size={14} />
              تلاش مجدد
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && enabled && data && !hasData && (
          <div className="text-center py-16 space-y-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'var(--color-brand-light)' }}
            >
              <BarChart2Icon size={28} style={{ color: 'var(--color-brand)' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              داده‌ای برای این بازه وجود ندارد.
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              در این دوره زمانی هیچ نوبتی ثبت نشده است.
            </p>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && hasData && (
          <>
            {/* Metric cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                label="درآمد کل"
                value={formatCurrency(data.revenue.total)}
                sub={`${formatNum(data.revenue.completed_count)} نوبت انجام شده`}
                icon={<WalletIcon size={16} />}
                colorVar="--color-success"
                bgVar="--color-success-bg"
              />
              <MetricCard
                label="میانگین هر نوبت"
                value={formatCurrency(data.revenue.average)}
                sub="از نوبت‌های انجام شده"
                icon={<BarChart2Icon size={16} />}
                colorVar="--color-brand"
                bgVar="--color-brand-light"
              />
              <MetricCard
                label="کل نوبت‌ها"
                value={formatNum(data.appointments.total)}
                sub={`در این دوره`}
                icon={<CalendarIcon size={16} />}
                colorVar="--color-text-secondary"
                bgVar="--color-surface"
              />
              <MetricCard
                label="لغو / غیبت"
                value={formatNum(
                  (data.appointments.by_status.cancelled ?? 0) +
                  (data.appointments.by_status.no_show ?? 0)
                )}
                sub={`${formatNum(data.appointments.by_status.no_show ?? 0)} غیبت`}
                icon={<XCircleIcon size={16} />}
                colorVar="--color-warning"
                bgVar="--color-warning-bg"
              />
            </div>

            {/* Status breakdown */}
            <StatusBreakdown
              byStatus={data.appointments.by_status}
              total={data.appointments.total}
            />

            {/* Daily chart */}
            {data.daily_appointments.length > 0 && (
              <div className="card p-4">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  نمودار نوبت‌های روزانه
                </h2>
                <DailyChart data={data.daily_appointments} />
              </div>
            )}

            {/* Top services */}
            {data.top_services.length > 0 && (
              <div className="card p-4">
                <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  پرفروش‌ترین خدمات
                </h2>
                <TopServicesTable services={data.top_services} />
              </div>
            )}
          </>
        )}
      </div>
    </OwnerLayout>
  )
}
