interface LoadingSkeletonProps {
  type?: 'table' | 'card' | 'grid' | 'dashboard' | 'list' | 'assetGrid' | 'licenseTable';
  rows?: number;
}

// Shimmer effect component for skeleton loading
const ShimmerEffect = () => (
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-gray-700/60" />
);

// Individual skeleton elements with shimmer
const SkeletonBox = ({ className }: { className: string }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-700 ${className}`}>
    <ShimmerEffect />
  </div>
);

const LoadingSkeleton = ({ type = 'table', rows = 5 }: LoadingSkeletonProps) => {
  if (type === 'table') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <SkeletonBox className="h-4 rounded w-8" />
          <SkeletonBox className="h-4 rounded w-1/4" />
          <SkeletonBox className="h-4 rounded w-1/5" />
          <SkeletonBox className="h-4 rounded w-1/6" />
          <SkeletonBox className="h-4 rounded w-1/6" />
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
          <div 
            key={i} 
            className="flex gap-4 py-3 border-b border-gray-100 dark:border-gray-800"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <SkeletonBox className="h-4 rounded w-8" />
            <SkeletonBox className="h-4 rounded w-1/4" />
            <SkeletonBox className="h-4 rounded w-1/5" />
            <SkeletonBox className="h-4 rounded w-1/6" />
            <SkeletonBox className="h-4 rounded w-1/6" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-4">
          <SkeletonBox className="w-12 h-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 rounded w-3/4" />
            <SkeletonBox className="h-3 rounded w-1/2" />
          </div>
        </div>
        <div className="space-y-2">
          <SkeletonBox className="h-3 rounded w-full" />
          <SkeletonBox className="h-3 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (type === 'grid' || type === 'assetGrid') {
    return (
      <div className="space-y-6">
        {/* Category cards skeleton */}
        {type === 'assetGrid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            {[...Array(6)].map((_, i) => (
              <div 
                key={`cat-${i}`} 
                className="bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 border-gray-200 dark:border-gray-700"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <SkeletonBox className="w-10 h-10 rounded-xl mx-auto mb-2" />
                <SkeletonBox className="h-3 rounded w-16 mx-auto mb-1" />
                <SkeletonBox className="h-2 rounded w-12 mx-auto" />
              </div>
            ))}
          </div>
        )}
        
        {/* Asset cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(rows)].map((_, i) => (
            <div 
              key={i} 
              className="bg-white dark:bg-gray-800 rounded-2xl p-5 border-2 border-gray-200 dark:border-gray-700"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <SkeletonBox className="w-14 h-14 rounded-xl" />
                <div className="flex gap-1">
                  <SkeletonBox className="w-7 h-7 rounded-lg" />
                  <SkeletonBox className="w-7 h-7 rounded-lg" />
                </div>
              </div>
              <SkeletonBox className="h-5 rounded w-3/4 mb-2" />
              <SkeletonBox className="h-3 rounded w-2/3 mb-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <SkeletonBox className="h-3 rounded w-12" />
                  <SkeletonBox className="h-5 rounded-full w-16" />
                </div>
                <div className="flex justify-between">
                  <SkeletonBox className="h-3 rounded w-16" />
                  <SkeletonBox className="h-5 rounded-full w-14" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <SkeletonBox className="w-7 h-7 rounded-full" />
                  <SkeletonBox className="h-3 rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'licenseTable') {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonBox className="h-10 rounded-lg w-64" />
            <SkeletonBox className="h-4 rounded-lg w-96" />
          </div>
          <div className="flex gap-3">
            <SkeletonBox className="h-10 w-28 rounded-xl" />
            <SkeletonBox className="h-10 w-32 rounded-xl" />
            <SkeletonBox className="h-10 w-28 rounded-xl" />
          </div>
        </div>

        {/* Filter bar skeleton */}
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <SkeletonBox className="h-12 rounded-2xl w-full" />
              </div>
              <SkeletonBox className="h-12 rounded-2xl w-full" />
            </div>
          </div>
        </div>

        {/* Table skeleton */}
        <div className="space-y-2">
          {[...Array(rows)].map((_, i) => (
            <div 
              key={i} 
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-700 flex items-center gap-4"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <SkeletonBox className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-4 rounded w-1/3" />
                <SkeletonBox className="h-3 rounded w-1/4" />
              </div>
              <SkeletonBox className="h-6 rounded w-16 hidden md:block" />
              <SkeletonBox className="h-4 rounded w-20 hidden md:block" />
              <div className="hidden lg:block w-32">
                <SkeletonBox className="h-2.5 rounded-full w-full mb-1" />
                <SkeletonBox className="h-3 rounded w-10" />
              </div>
              <SkeletonBox className="h-4 rounded w-24 hidden md:block" />
              <SkeletonBox className="h-6 rounded-full w-16" />
              <div className="flex gap-1">
                <SkeletonBox className="w-8 h-8 rounded-lg" />
                <SkeletonBox className="w-8 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <SkeletonBox className="h-10 rounded-lg w-48" />
            <SkeletonBox className="h-4 rounded-lg w-64" />
          </div>
          <div className="flex gap-3">
            <SkeletonBox className="h-9 w-28 rounded-xl" />
            <SkeletonBox className="h-9 w-24 rounded-xl" />
            <SkeletonBox className="h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-700"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-2">
                  <SkeletonBox className="h-3 rounded w-20" />
                  <SkeletonBox className="h-10 rounded w-16" />
                </div>
                <SkeletonBox className="w-14 h-14 rounded-2xl" />
              </div>
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                <SkeletonBox className="h-4 rounded w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions & Alerts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <SkeletonBox className="h-6 rounded w-32 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <SkeletonBox key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-700">
            <SkeletonBox className="h-6 rounded w-24 mb-4" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonBox key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <SkeletonBox className="h-6 rounded w-32" />
              </div>
              <div className="p-6">
                <SkeletonBox className="h-64 rounded-xl w-full" />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <SkeletonBox className="h-6 rounded w-48" />
              </div>
              <div className="p-6">
                <SkeletonBox className="h-48 rounded-xl w-full" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <SkeletonBox className="h-6 rounded w-32" />
              </div>
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <SkeletonBox className="w-8 h-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <SkeletonBox className="h-3 rounded w-3/4" />
                      <SkeletonBox className="h-2 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-700">
              <SkeletonBox className="h-5 rounded w-24 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <SkeletonBox key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default list skeleton
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
          style={{ animationDelay: `${i * 75}ms` }}
        >
          <SkeletonBox className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 rounded w-3/4" />
            <SkeletonBox className="h-3 rounded w-1/2" />
          </div>
          <SkeletonBox className="w-20 h-8 rounded" />
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
