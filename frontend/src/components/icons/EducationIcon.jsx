export default function EducationIcon({ size = 48, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="edu-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#FF6B2B" />
        </linearGradient>
        <filter id="edu-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#F59E0B" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#edu-grad)" opacity="0.12" />
      <g filter="url(#edu-shadow)" fill="url(#edu-grad)">
        <path d="M8 18v14c0 1.1.9 2 2 2h12V16H10c-1.1 0-2 .9-2 2z" opacity="0.7" />
        <path d="M26 16v18h12c1.1 0 2-.9 2-2V18c0-1.1-.9-2-2-2H26z" />
        <path d="M24 14l-2 2h4l-2-2z" />
        <rect x="22" y="16" width="4" height="18" fill="url(#edu-grad)" opacity="0.4" />
        <line x1="12" y1="22" x2="20" y2="22" stroke="white" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        <line x1="12" y1="26" x2="18" y2="26" stroke="white" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        <line x1="28" y1="22" x2="36" y2="22" stroke="white" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        <line x1="28" y1="26" x2="34" y2="26" stroke="white" strokeWidth="1.5" opacity="0.3" strokeLinecap="round" />
        <path d="M18 8l6-2 6 2v4l-6 2-6-2V8z" opacity="0.5" />
        <line x1="24" y1="12" x2="24" y2="16" stroke="url(#edu-grad)" strokeWidth="1.5" opacity="0.5" />
      </g>
    </svg>
  )
}
