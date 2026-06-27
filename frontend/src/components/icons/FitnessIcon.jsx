export default function FitnessIcon({ size = 48, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fitness-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4C8" />
          <stop offset="100%" stopColor="#39FF14" />
        </linearGradient>
        <filter id="fitness-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#00D4C8" floodOpacity="0.4" />
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#fitness-grad)" opacity="0.12" />
      <g filter="url(#fitness-shadow)" fill="url(#fitness-grad)">
        <rect x="8" y="21" width="32" height="6" rx="3" />
        <rect x="5" y="16" width="7" height="16" rx="3.5" />
        <rect x="36" y="16" width="7" height="16" rx="3.5" />
        <rect x="11" y="18.5" width="4" height="11" rx="2" opacity="0.6" />
        <rect x="33" y="18.5" width="4" height="11" rx="2" opacity="0.6" />
      </g>
    </svg>
  )
}
