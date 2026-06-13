const SIZES = {
  xs: 'w-3.5 h-3.5 border-2',
  sm: 'w-4   h-4   border-2',
  md: 'w-6   h-6   border-2',
  lg: 'w-8   h-8   border-[3px]',
}

export default function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      role="status"
      aria-label="در حال بارگذاری"
      className={`inline-flex items-center justify-center ${className}`}
    >
      <span
        className={`${SIZES[size] ?? SIZES.md} border-cyan-200 border-t-cyan-500 rounded-full animate-spin block`}
      />
    </span>
  )
}
