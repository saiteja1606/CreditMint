export const Spinner = ({ className = 'h-4 w-4', light = false }) => (
  <span
    className={`${className} inline-block rounded-full border-2 ${
      light ? 'border-white/35 border-t-white' : 'border-brand-500/25 border-t-brand-500'
    } animate-spin`}
    aria-hidden="true"
  />
)

export const LoadingButtonContent = ({ loading, loadingText, children }) => (
  <span className="inline-flex items-center justify-center gap-2">
    {loading && <Spinner light />}
    <span>{loading ? loadingText : children}</span>
  </span>
)

export const CardSkeletonGrid = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ${className}`}>
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="card h-28 animate-pulse rounded-2xl p-5 skeleton" />
    ))}
  </div>
)
