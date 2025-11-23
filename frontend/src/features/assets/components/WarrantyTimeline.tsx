import { FiCalendar, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

interface WarrantyTimelineProps {
  purchaseDate?: string | Date;
  warrantyStart?: string | Date;
  warrantyEnd?: string | Date;
  currentDate?: Date;
}

/**
 * Visual warranty timeline component
 */
const WarrantyTimeline = ({ 
  warrantyStart, 
  warrantyEnd, 
  currentDate = new Date() 
}: WarrantyTimelineProps) => {
  if (!warrantyStart || !warrantyEnd) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FiAlertCircle size={48} className="mx-auto mb-4 opacity-30" />
        <p className="text-sm">Warranty information not available</p>
      </div>
    );
  }

  const start = new Date(warrantyStart);
  const end = new Date(warrantyEnd);
  const now = new Date(currentDate);

  const totalDuration = end.getTime() - start.getTime();
  const elapsed = Math.max(0, now.getTime() - start.getTime());
  const remaining = Math.max(0, end.getTime() - now.getTime());

  const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  const isExpired = now > end;
  const isExpiringSoon = daysRemaining <= 90 && daysRemaining > 0;

  const getStatusColor = (): 'green' | 'orange' | 'red' => {
    if (isExpired) return 'red';
    if (isExpiringSoon) return 'orange';
    return 'green';
  };

  const statusColors = {
    green: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-900',
      bar: 'bg-gradient-to-r from-green-500 to-emerald-600',
      icon: 'text-green-600',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-500',
      text: 'text-orange-900',
      bar: 'bg-gradient-to-r from-orange-500 to-amber-600',
      icon: 'text-orange-600',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      bar: 'bg-gradient-to-r from-red-500 to-rose-600',
      icon: 'text-red-600',
    },
  };

  const color = getStatusColor();
  const colors = statusColors[color];

  return (
    <div className={`${colors.bg} ${colors.border} border-2 rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FiCalendar className={colors.icon} size={24} />
          <div>
            <h3 className={`font-semibold ${colors.text}`}>Warranty Timeline</h3>
            <p className="text-sm text-gray-600">
              {isExpired
                ? 'Warranty has expired'
                : isExpiringSoon
                ? 'Warranty expiring soon'
                : 'Warranty active'}
            </p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full ${colors.border} border-2 ${colors.text} font-semibold text-sm`}>
          {isExpired ? (
            <span className="flex items-center gap-1">
              <FiAlertCircle size={16} />
              Expired
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <FiCheckCircle size={16} />
              Active
            </span>
          )}
        </div>
      </div>

      {/* Timeline Bar */}
      <div className="relative mb-4">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Start: {start.toLocaleDateString()}</span>
          <span>End: {end.toLocaleDateString()}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className={`text-2xl font-bold ${colors.text} mb-1`}>
            {Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))}
          </div>
          <div className="text-xs text-gray-600">Days Elapsed</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${colors.text} mb-1`}>
            {isExpired ? 0 : daysRemaining}
          </div>
          <div className="text-xs text-gray-600">Days Remaining</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${colors.text} mb-1`}>
            {Math.round(percentage)}%
          </div>
          <div className="text-xs text-gray-600">Used</div>
        </div>
      </div>

      {/* Warning Message */}
      {isExpiringSoon && !isExpired && (
        <div className={`mt-4 p-3 rounded-lg ${colors.border} border-2 ${colors.bg}`}>
          <div className="flex items-center gap-2">
            <FiClock className={colors.icon} size={18} />
            <p className={`text-sm font-medium ${colors.text}`}>
              Warranty expires in {daysRemaining} days. Consider renewal or replacement.
            </p>
          </div>
        </div>
      )}

      {isExpired && (
        <div className={`mt-4 p-3 rounded-lg ${colors.border} border-2 ${colors.bg}`}>
          <div className="flex items-center gap-2">
            <FiAlertCircle className={colors.icon} size={18} />
            <p className={`text-sm font-medium ${colors.text}`}>
              This warranty has expired. No coverage available.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarrantyTimeline;

