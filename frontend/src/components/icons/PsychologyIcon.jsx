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
      <g filter="url(#psych-shadow)" fill="url(#psych-grad)">
        <path d="M24 6C16.3 6 10 11.4 10 18c0 3.5 1.8 6.6 4.5 8.8V38c0 1.1.9 2 2 2h15c1.1 0 2-.9 2-2v-11.2C36.2 24.6 38 21.5 38 18c0-6.6-6.3-12-14-12z" opacity="0.85" />
        <path d="M24 6c-3.5 0-6.7 1.2-9.2 3.2C17.5 7.8 20.6 7 24 7s6.5.8 9.2 2.2C30.7 7.2 27.5 6 24 6z" fill="white" opacity="0.3" />
        <line x1="24" y1="14" x2="24" y2="30" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <line x1="16" y1="22" x2="32" y2="22" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <circle cx="20" cy="18" r="2" fill="white" opacity="0.25" />
        <circle cx="28" cy="18" r="2" fill="white" opacity="0.25" />
        <circle cx="20" cy="26" r="1.5" fill="white" opacity="0.2" />
        <circle cx="28" cy="26" r="1.5" fill="white" opacity="0.2" />
      </g>
    </svg>
  )
}
