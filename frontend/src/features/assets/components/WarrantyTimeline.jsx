import { FiCalendar, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

/**
 * Visual warranty timeline component
 */
const WarrantyTimeline = ({ 
  purchaseDate, 
  warrantyStart, 
  warrantyEnd, 
  currentDate = new Date() 
}) => {
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

  const totalDuration = end - start;
  const elapsed = Math.max(0, now - start);
  const remaining = Math.max(0, end - now);

  const percentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
  const isExpired = now > end;
  const isExpiringSoon = daysRemaining <= 90 && daysRemaining > 0;

  const getStatusColor = () => {
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

  const colors = statusColors[getStatusColor()];

  return (
    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${colors.bg} ring-2 ring-white`}>
            {isExpired ? (
              <FiAlertCircle className={colors.icon} size={24} />
            ) : isExpiringSoon ? (
              <FiClock className={colors.icon} size={24} />
            ) : (
              <FiCheckCircle className={colors.icon} size={24} />
            )}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${colors.text}`}>
              {isExpired ? 'Warranty Expired' : isExpiringSoon ? 'Warranty Expiring Soon' : 'Warranty Active'}
            </h3>
            <p className="text-sm text-gray-600">
              {isExpired
                ? `Expired ${Math.abs(daysRemaining)} days ago`
                : `${daysRemaining} days remaining`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold ${colors.text}">{Math.round(percentage)}%</p>
          <p className="text-xs text-gray-600">Used</p>
        </div>
      </div>

      {/* Timeline Progress Bar */}
      <div className="mb-6">
        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} transition-all duration-1000 ease-out`}
            style={{ width: `${percentage}%` }}
          />
          {/* Current date marker */}
          {!isExpired && (
            <div
              className="absolute top-0 h-full w-1 bg-gray-800 z-10"
              style={{ left: `${percentage}%` }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Today
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Markers */}
      <div className="grid grid-cols-3 gap-4">
        {/* Start Date */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-gray-300">
              <FiCalendar className="text-gray-600" size={18} />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-700">Start Date</p>
          <p className="text-sm font-bold text-gray-900 mt-1">
            {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Current Status */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
              isExpired ? 'from-red-500 to-red-600' :
              isExpiringSoon ? 'from-orange-500 to-orange-600' :
              'from-green-500 to-green-600'
            } flex items-center justify-center border-2 border-white shadow-lg`}>
              {isExpired ? (
                <FiAlertCircle className="text-white" size={18} />
              ) : isExpiringSoon ? (
                <FiClock className="text-white" size={18} />
              ) : (
                <FiCheckCircle className="text-white" size={18} />
              )}
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-700">Current</p>
          <p className={`text-sm font-bold mt-1 ${colors.text}`}>
            {isExpired ? 'EXPIRED' : isExpiringSoon ? `${daysRemaining} days` : 'ACTIVE'}
          </p>
        </div>

        {/* End Date */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-gray-300">
              <FiCalendar className="text-gray-600" size={18} />
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-700">End Date</p>
          <p className="text-sm font-bold text-gray-900 mt-1">
            {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Total Coverage</p>
          <p className="font-bold text-gray-900">
            {Math.ceil(totalDuration / (1000 * 60 * 60 * 24))} days
          </p>
        </div>
        <div>
          <p className="text-gray-600">Days Elapsed</p>
          <p className="font-bold text-gray-900">
            {Math.ceil(elapsed / (1000 * 60 * 60 * 24))} days
          </p>
        </div>
      </div>
    </div>
  );
};

export default WarrantyTimeline;

