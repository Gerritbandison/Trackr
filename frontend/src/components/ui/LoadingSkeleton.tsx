interface LoadingSkeletonProps {
  type?: 'table' | 'card' | 'grid' | 'dashboard' | 'list';
  rows?: number;
}

const LoadingSkeleton = ({ type = 'table', rows = 5 }: LoadingSkeletonProps) => {
  if (type === 'table') {
    return (
      <div className="animate-pulse space-y-4">
        {/* Header */}
        <div className="flex gap-4 pb-3 border-b border-gray-200">
          <div className="h-4 bg-gray-200 rounded w-8"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex gap-4 py-3 border-b border-gray-100">
            <div className="h-4 bg-gray-100 rounded w-8"></div>
            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/5"></div>
            <div className="h-4 bg-gray-100 rounded w-1/6"></div>
            <div className="h-4 bg-gray-100 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="animate-pulse">
        <div className="border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-100 rounded w-full"></div>
            <div className="h-3 bg-gray-100 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full"></div>
                <div className="h-3 bg-gray-100 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded-lg w-64 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-3xl border-2 border-gray-200 animate-pulse"></div>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-80 bg-gray-100 rounded-3xl border-2 border-gray-200 animate-pulse"></div>
            <div className="h-64 bg-gray-100 rounded-3xl border-2 border-gray-200 animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-gray-100 rounded-3xl border-2 border-gray-200 animate-pulse"></div>
            <div className="h-48 bg-gray-100 rounded-3xl border-2 border-gray-200 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Default list skeleton
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
          <div className="w-20 h-8 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
