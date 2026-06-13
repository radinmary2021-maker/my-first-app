/**
 * Nobatic brand logo — calendar icon with checkmark on a rounded cyan square.
 * Works at any size; text is optional.
 */
export default function Logo({ size = 36, showText = true, textColor = '#06B6D4', textSize = 18 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: showText ? 10 : 0 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Nobatic"
        role="img"
      >
        {/* Background square */}
        <rect width="40" height="40" rx="11" fill="#0891B2"/>

        {/* Calendar outline */}
        <rect x="8" y="12" width="24" height="21" rx="3" stroke="white" strokeWidth="2"/>

        {/* Calendar top line (header divider) */}
        <line x1="8" y1="19" x2="32" y2="19" stroke="white" strokeWidth="2"/>

        {/* Calendar pins */}
        <line x1="15" y1="8" x2="15" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="25" y1="8" x2="25" y2="16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>

        {/* Checkmark — represents confirmed appointment */}
        <path d="M14 26.5L18 30.5L27 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      {showText && (
        <span style={{ color: textColor, fontSize: textSize, fontWeight: 800, letterSpacing: '-0.3px' }}>
          Nobatic
        </span>
      )}
    </div>
  )
}
