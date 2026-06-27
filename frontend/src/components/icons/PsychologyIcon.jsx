export default function PsychologyIcon({ size = 48, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="psych-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#00A8FF" />
        </linearGradient>
        <filter id="psych-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#7C3AED" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#psych-grad)" opacity="0.12" />
      <g filter="url(#psych-shadow)">
        {/* نیمکره چپ مغز */}
        <path d="M24 8C17 8 11 13 11 20c0 4 2 7.5 5 9.5V38a2 2 0 0 0 2 2h6V8z" fill="url(#psych-grad)" opacity="0.85" />
        {/* نیمکره راست مغز */}
        <path d="M24 8c7 0 13 5 13 12 0 4-2 7.5-5 9.5V38a2 2 0 0 1-2 2h-6V8z" fill="url(#psych-grad)" opacity="0.65" />
        {/* شکنج‌های مغز */}
        <path d="M18 14c2 1 3 4 1 6s-3 4-1 7" stroke="#E8F4FF" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M30 14c-2 1-3 4-1 6s3 4 1 7" stroke="#E8F4FF" strokeWidth="1.2" fill="none" opacity="0.35" strokeLinecap="round" />
        <path d="M24 12v8" stroke="#E8F4FF" strokeWidth="1" fill="none" opacity="0.25" />
        {/* نقاط سیناپس */}
        <circle cx="16" cy="18" r="1.5" fill="#00A8FF" opacity="0.6" />
        <circle cx="32" cy="18" r="1.5" fill="#7C3AED" opacity="0.6" />
        <circle cx="20" cy="26" r="1.2" fill="#00A8FF" opacity="0.5" />
        <circle cx="28" cy="26" r="1.2" fill="#7C3AED" opacity="0.5" />
        <circle cx="24" cy="22" r="1" fill="#E8F4FF" opacity="0.4" />
        {/* ساقه مغز */}
        <rect x="22" y="38" width="4" height="4" rx="1" fill="url(#psych-grad)" opacity="0.5" />
      </g>
    </svg>
  )
}
