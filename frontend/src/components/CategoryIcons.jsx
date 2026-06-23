export function BeautyIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-md">
      <defs>
        <linearGradient id="blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="handle-pink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
      </defs>
      <path d="M38 8 L22 36" stroke="url(#blade)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M26 8 L42 36" stroke="url(#blade)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <ellipse cx="22" cy="44" rx="8" ry="10" fill="url(#handle-pink)" />
      <ellipse cx="22" cy="44" rx="5" ry="7" fill="#f9a8d4" opacity=".4" />
      <ellipse cx="42" cy="44" rx="8" ry="10" fill="url(#handle-pink)" />
      <ellipse cx="42" cy="44" rx="5" ry="7" fill="#f9a8d4" opacity=".4" />
    </svg>
  )
}

export function FitnessIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-md">
      <defs>
        <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="weight-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect x="18" y="29" width="28" height="6" rx="3" fill="url(#bar)" />
      <rect x="6" y="22" width="10" height="20" rx="3" fill="url(#weight-blue)" />
      <rect x="8" y="24" width="4" height="16" rx="2" fill="#93c5fd" opacity=".4" />
      <rect x="48" y="22" width="10" height="20" rx="3" fill="url(#weight-blue)" />
      <rect x="50" y="24" width="4" height="16" rx="2" fill="#93c5fd" opacity=".4" />
      <rect x="2" y="26" width="6" height="12" rx="2" fill="#1d4ed8" />
      <rect x="56" y="26" width="6" height="12" rx="2" fill="#1d4ed8" />
    </svg>
  )
}

export function EducationIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-md">
      <defs>
        <linearGradient id="book-green" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="page" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      <path d="M8 14 Q8 10 14 10 L30 10 Q32 10 32 12 L32 50 Q32 48 30 48 L14 48 Q8 48 8 44 Z" fill="url(#book-green)" />
      <path d="M10 14 L10 44 Q10 46 14 46 L30 46 L30 12 L14 12 Q10 12 10 14 Z" fill="url(#page)" />
      <path d="M56 14 Q56 10 50 10 L34 10 Q32 10 32 12 L32 50 Q32 48 34 48 L50 48 Q56 48 56 44 Z" fill="url(#book-green)" />
      <path d="M54 14 L54 44 Q54 46 50 46 L34 46 L34 12 L50 12 Q54 12 54 14 Z" fill="url(#page)" />
      <line x1="15" y1="20" x2="27" y2="20" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="15" y1="26" x2="25" y2="26" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="15" y1="32" x2="26" y2="32" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="37" y1="20" x2="49" y2="20" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="37" y1="26" x2="47" y2="26" stroke="#cbd5e1" strokeWidth="1.5" />
      <line x1="37" y1="32" x2="48" y2="32" stroke="#cbd5e1" strokeWidth="1.5" />
    </svg>
  )
}

export function CounselingIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-md">
      <defs>
        <linearGradient id="bubble1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="bubble2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
      <rect x="4" y="6" width="36" height="28" rx="8" fill="url(#bubble1)" />
      <polygon points="14,34 10,44 22,34" fill="#7c3aed" />
      <rect x="6" y="8" width="14" height="6" rx="3" fill="#c4b5fd" opacity=".35" />
      <circle cx="14" cy="20" r="2.5" fill="white" opacity=".7" />
      <circle cx="22" cy="20" r="2.5" fill="white" opacity=".7" />
      <circle cx="30" cy="20" r="2.5" fill="white" opacity=".7" />
      <rect x="26" y="26" width="34" height="24" rx="7" fill="url(#bubble2)" />
      <polygon points="50,50 54,58 42,50" fill="#a78bfa" />
      <circle cx="36" cy="38" r="2" fill="white" opacity=".7" />
      <circle cx="43" cy="38" r="2" fill="white" opacity=".7" />
      <circle cx="50" cy="38" r="2" fill="white" opacity=".7" />
    </svg>
  )
}

export function VeterinaryIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-md">
      <defs>
        <linearGradient id="paw-orange" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="paw-dark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="38" rx="14" ry="16" fill="url(#paw-orange)" />
      <ellipse cx="30" cy="36" rx="8" ry="10" fill="#fcd34d" opacity=".35" />
      <ellipse cx="18" cy="18" rx="6" ry="8" fill="url(#paw-dark)" transform="rotate(-15 18 18)" />
      <ellipse cx="17" cy="16" rx="3" ry="5" fill="#fcd34d" opacity=".3" transform="rotate(-15 17 16)" />
      <ellipse cx="32" cy="14" rx="6" ry="7" fill="url(#paw-dark)" />
      <ellipse cx="31" cy="12" rx="3" ry="4" fill="#fcd34d" opacity=".3" />
      <ellipse cx="46" cy="18" rx="6" ry="8" fill="url(#paw-dark)" transform="rotate(15 46 18)" />
      <ellipse cx="45" cy="16" rx="3" ry="5" fill="#fcd34d" opacity=".3" transform="rotate(15 45 16)" />
    </svg>
  )
}

export function AutomotiveIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-12 h-12 drop-shadow-md">
      <defs>
        <linearGradient id="car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <linearGradient id="car-window" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>
      <path d="M8 38 L12 24 Q14 20 18 20 L46 20 Q50 20 52 24 L56 38 Z" fill="url(#car-body)" />
      <path d="M10 36 L14 24 Q16 22 18 22 L30 22 L30 36 Z" fill="url(#car-window)" />
      <path d="M34 22 L46 22 Q48 22 50 24 L54 36 L34 36 Z" fill="url(#car-window)" />
      <rect x="4" y="36" width="56" height="12" rx="4" fill="url(#car-body)" />
      <rect x="6" y="38" width="20" height="4" rx="2" fill="#67e8f9" opacity=".35" />
      <circle cx="16" cy="48" r="6" fill="#334155" />
      <circle cx="16" cy="48" r="3" fill="#94a3b8" />
      <circle cx="48" cy="48" r="6" fill="#334155" />
      <circle cx="48" cy="48" r="3" fill="#94a3b8" />
      <rect x="2" y="40" width="6" height="3" rx="1" fill="#fbbf24" />
      <rect x="56" y="40" width="6" height="3" rx="1" fill="#ef4444" />
    </svg>
  )
}
