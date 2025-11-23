import { FiPackage } from 'react-icons/fi';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const LoadingSpinner = ({ fullScreen = false, size = 'md' }: LoadingSpinnerProps) => {
  const sizeClasses: Record<string, string> = {
    sm: 'w-4 h-4',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const iconSizes: Record<string, number> = {
    sm: 12,
    md: 20,
    lg: 28,
    xl: 40,
  };

  const spinner = (
    <div className="relative">
      <div className={`spinner ${sizeClasses[size]} border-4`} role="status">
        <span className="sr-only">Loading...</span>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center ${sizeClasses[size]}`}>
        <FiPackage className="text-primary-600 animate-pulse" size={iconSizes[size]} />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 backdrop-blur-sm z-50">
        <div className="text-center animate-scale-in">
          <div className="mb-6">
            {spinner}
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-secondary-900">Loading your workspace</p>
            <p className="text-sm text-secondary-600">Please wait a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  return <div className="flex justify-center items-center p-8">{spinner}</div>;
};

export default LoadingSpinner;

