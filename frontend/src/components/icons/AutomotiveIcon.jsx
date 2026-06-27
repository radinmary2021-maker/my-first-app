export default function AutomotiveIcon({ size = 48, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="auto-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0047FF" />
          <stop offset="100%" stopColor="#00D4C8" />
        </linearGradient>
        <filter id="auto-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0047FF" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#auto-grad)" opacity="0.12" />
      <g filter="url(#auto-shadow)">
        <circle cx="24" cy="24" r="14" fill="none" stroke="url(#auto-grad)" strokeWidth="3.5" />
        <circle cx="24" cy="24" r="4" fill="url(#auto-grad)" />
        <line x1="24" y1="10" x2="24" y2="20" stroke="url(#auto-grad)" strokeWidth="3" strokeLinecap="round" />
        <line x1="24" y1="28" x2="24" y2="38" stroke="url(#auto-grad)" strokeWidth="3" strokeLinecap="round" />
        <line x1="10" y1="24" x2="20" y2="24" stroke="url(#auto-grad)" strokeWidth="3" strokeLinecap="round" />
        <line x1="28" y1="24" x2="38" y2="24" stroke="url(#auto-grad)" strokeWidth="3" strokeLinecap="round" />
      </g>
    </svg>
  )
}
