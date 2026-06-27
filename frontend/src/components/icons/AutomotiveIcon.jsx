export default function AutomotiveIcon({ size = 48, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="auto-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0047FF" />
          <stop offset="100%" stopColor="#00D4C8" />
        </linearGradient>
        <filter id="auto-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0047FF" floodOpacity="0.4" />
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#auto-grad)" opacity="0.12" />
      <g filter="url(#auto-shadow)">
        {/* بدنه */}
        <rect x="8" y="26" width="32" height="10" rx="3" fill="url(#auto-grad)" />
        {/* سقف */}
        <path d="M14 26L18 16h12l4 10z" fill="url(#auto-grad)" opacity="0.9" />
        {/* شیشه */}
        <path d="M17 24l3-7h8l3 7z" fill="#E8F4FF" opacity="0.3" />
        {/* چراغ‌ها */}
        <rect x="9" y="28" width="5" height="3" rx="1" fill="#FFD700" opacity="0.7" />
        <rect x="34" y="28" width="5" height="3" rx="1" fill="#FFD700" opacity="0.7" />
        {/* چرخ چپ */}
        <circle cx="15" cy="36" r="4" fill="#162030" stroke="url(#auto-grad)" strokeWidth="2" />
        <circle cx="15" cy="36" r="1.5" fill="url(#auto-grad)" opacity="0.5" />
        {/* چرخ راست */}
        <circle cx="33" cy="36" r="4" fill="#162030" stroke="url(#auto-grad)" strokeWidth="2" />
        <circle cx="33" cy="36" r="1.5" fill="url(#auto-grad)" opacity="0.5" />
      </g>
    </svg>
  )
}
