export default function BeautyIcon({ size = 48, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="beauty-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B9D" />
          <stop offset="100%" stopColor="#C44DFF" />
        </linearGradient>
        <filter id="beauty-shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#C44DFF" floodOpacity="0.35" />
        </filter>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#beauty-grad)" opacity="0.12" />
      <g filter="url(#beauty-shadow)" fill="url(#beauty-grad)">
        <path d="M20 8c-1.1 0-2 .9-2 2v12.6L14.4 27c-.8.8-.8 2 0 2.8.8.8 2 .8 2.8 0L20 27v-5h2v5l2.8 2.8c.8.8 2 .8 2.8 0 .8-.8.8-2 0-2.8L24 22.6V10c0-1.1-.9-2-2-2h-2z" />
        <path d="M30 12c0-1.7 1.3-3 3-3s3 1.3 3 3v8c0 1.7-1.3 3-3 3s-3-1.3-3-3v-8z" opacity="0.7" />
        <circle cx="33" cy="28" r="2" opacity="0.5" />
        <path d="M10 34l4 6h14l4-6" stroke="url(#beauty-grad)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>
    </svg>
  )
}
