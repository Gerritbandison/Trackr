import { Link } from 'react-router-dom';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary', link }) => {
  const colorClasses = {
    primary: {
      bg: 'bg-gradient-to-br from-primary-500 to-primary-600',
      icon: 'bg-primary-50 text-primary-600',
      border: 'border-primary-100',
    },
    success: {
      bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      icon: 'bg-emerald-50 text-emerald-600',
      border: 'border-emerald-100',
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-500 to-amber-600',
      icon: 'bg-amber-50 text-amber-600',
      border: 'border-amber-100',
    },
    danger: {
      bg: 'bg-gradient-to-br from-red-500 to-red-600',
      icon: 'bg-red-50 text-red-600',
      border: 'border-red-100',
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      icon: 'bg-blue-50 text-blue-600',
      border: 'border-blue-100',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      icon: 'bg-purple-50 text-purple-600',
      border: 'border-purple-100',
    },
  };

  const currentColor = colorClasses[color];

  const content = (
    <div className="stat-card group relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform translate-x-8 -translate-y-8">
        {Icon && <Icon size={128} />}
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-secondary-600 uppercase tracking-wide mb-2">
              {title}
            </p>
            <p className="text-4xl font-bold text-secondary-900 tracking-tight">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={`stat-card-icon ${currentColor.icon} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} />
            </div>
          )}
        </div>

        {(trend || trendValue) && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            {trend && (
              <span className={`flex items-center gap-1 text-sm font-medium ${
                trend === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
              </span>
            )}
            <span className="text-sm text-secondary-600">{trendValue}</span>
          </div>
        )}
      </div>

      {/* Hover gradient border effect */}
      <div className={`absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${currentColor.border}`}></div>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
};

export default StatCard;

