export default function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="flex gap-3">
        <div className="h-3 bg-gray-100 rounded w-20" />
        <div className="h-3 bg-gray-100 rounded w-24" />
      </div>
      <div className="flex gap-1">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="w-8 h-8 rounded-full bg-gray-100" />
        ))}
      </div>
      <div className="h-10 bg-gray-100 rounded-xl" />
    </div>
  )
}
