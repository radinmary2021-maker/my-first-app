export default function VeterinaryIcon({ size = 48, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="vet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B2B" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
        <filter id="vet-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#FF6B2B" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#vet-grad)" opacity="0.12" />
      <g filter="url(#vet-shadow)" fill="url(#vet-grad)">
        <ellipse cx="24" cy="30" rx="8" ry="9" />
        <circle cx="15" cy="16" r="5" />
        <circle cx="33" cy="16" r="5" />
        <circle cx="10" cy="25" r="4.5" />
        <circle cx="38" cy="25" r="4.5" />
        <path d="M20 28c0-2.2 1.8-4 4-4s4 1.8 4 4" fill="white" opacity="0.25" />
      </g>
    </svg>
  )
}
