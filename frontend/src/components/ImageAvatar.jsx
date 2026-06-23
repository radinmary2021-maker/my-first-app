import { useState } from 'react'

const COLORS = [
  ['#dbeafe', '#1d4ed8'],
  ['#dcfce7', '#15803d'],
  ['#fce7f3', '#9d174d'],
  ['#ede9fe', '#6d28d9'],
  ['#ffedd5', '#c2410c'],
  ['#cffafe', '#0e7490'],
]

function getColor(name) {
  let hash = 0
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function getInitials(name) {
  if (!name) return '؟'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) return parts[0][0] + parts[1][0]
  return parts[0].slice(0, 2)
}

export default function ImageAvatar({ src, alt, fallbackText, size = 'w-16 h-16', shape = 'rounded-xl', fit = 'cover', blurBg = false, className = '' }) {
  const [failed, setFailed] = useState(false)
  const [bg, fg] = getColor(fallbackText || alt || '')
  const initials = getInitials(fallbackText || alt || '')
  const showImage = src && !failed
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'

  return (
    <div className={`${size} ${shape} overflow-hidden shrink-0 flex items-center justify-center relative ${className}`}
         style={showImage && !blurBg ? { background: '#f1f5f9' } : !showImage ? { background: bg, color: fg } : undefined}>
      {showImage ? (
        blurBg ? (
          <>
            <img
              src={src}
              alt=""
              aria-hidden="true"
              onError={() => setFailed(true)}
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-60"
            />
            <div className="absolute inset-0 bg-slate-100/40" />
            <img
              src={src}
              alt={alt || ''}
              onError={() => setFailed(true)}
              className="relative w-full h-full object-contain object-center"
            />
          </>
        ) : (
          <img
            src={src}
            alt={alt || ''}
            onError={() => setFailed(true)}
            className={`w-full h-full ${fitClass} object-center`}
          />
        )
      ) : (
        <span style={{ fontSize: 'clamp(12px, 38%, 32px)', fontWeight: 700 }}>{initials}</span>
      )}
    </div>
  )
}
