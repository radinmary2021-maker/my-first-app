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

export default function ImageAvatar({ src, alt, fallbackText, size = 'w-16 h-16', shape = 'rounded-xl', className = '' }) {
  const [failed, setFailed] = useState(false)
  const [bg, fg] = getColor(fallbackText || alt || '')
  const initials = getInitials(fallbackText || alt || '')
  const showImage = src && !failed

  return (
    <div className={`${size} ${shape} overflow-hidden shrink-0 flex items-center justify-center ${className}`}
         style={showImage ? undefined : { background: bg, color: fg }}>
      {showImage ? (
        <img
          src={src}
          alt={alt || ''}
          onError={() => setFailed(true)}
          className="w-full h-full object-cover object-center"
        />
      ) : (
        <span style={{ fontSize: 'clamp(12px, 38%, 32px)', fontWeight: 700 }}>{initials}</span>
      )}
    </div>
  )
}
