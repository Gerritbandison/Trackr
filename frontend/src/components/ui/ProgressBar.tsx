import { useEffect, useState } from 'react';

/**
 * Progress bar component for batch operations
 */
interface ProgressBarProps {
  current?: number;
  total?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
}

const ProgressBar = ({ 
  current = 0, 
  total = 100, 
  label = '', 
  showPercentage = true,
  color = 'primary' 
}: ProgressBarProps) => {
  const [width, setWidth] = useState(0);
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  useEffect(() => {
    // Animate width change
    setTimeout(() => setWidth(percentage), 10);
  }, [percentage]);

  const colors: Record<string, string> = {
    primary: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-orange-600',
    danger: 'bg-red-600',
  };

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900">{percentage}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors[color]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${width}%` }}
        />
      </div>
      {total > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {current} of {total} completed
        </p>
      )}
    </div>
  );
};

export default ProgressBar;
