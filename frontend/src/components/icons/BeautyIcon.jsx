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
        {/* قیچی — تیغه چپ */}
        <ellipse cx="16" cy="14" rx="5" ry="2.5" transform="rotate(-30 16 14)" opacity="0.85" />
        <ellipse cx="32" cy="14" rx="5" ry="2.5" transform="rotate(30 32 14)" opacity="0.85" />
        {/* دسته‌ها */}
        <path d="M20 18c0 0-2 8-2 14a4 4 0 0 0 8 0c0-6-2-14-2-14z" opacity="0.9" />
        <path d="M24 18c0 0 2 8 2 14a4 4 0 0 1-8 0c0-6 2-14 2-14z" opacity="0.7" />
        {/* محل اتصال */}
        <circle cx="24" cy="18" r="3" fill="url(#beauty-grad)" />
        <circle cx="24" cy="18" r="1.5" fill="#E8F4FF" opacity="0.4" />
        {/* ستاره‌ها */}
        <circle cx="10" cy="24" r="1.5" fill="#FFD700" opacity="0.6" />
        <circle cx="38" cy="20" r="1" fill="#FFD700" opacity="0.5" />
        <circle cx="36" cy="28" r="1.2" fill="#FFD700" opacity="0.4" />
      </g>
    </svg>
  )
}
