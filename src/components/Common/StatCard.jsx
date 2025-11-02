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
    <div className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50/30 rounded-3xl p-6 border-2 border-slate-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-40 h-40 opacity-5 transform translate-x-12 -translate-y-12 group-hover:opacity-10 transition-opacity">
        {Icon && <Icon size={160} strokeWidth={0.5} />}
      </div>

      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentColor.bg} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              {title}
            </p>
            <p className="text-5xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={`relative w-16 h-16 rounded-2xl ${currentColor.bg} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <Icon size={28} className="text-white" strokeWidth={2.5} />
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          )}
        </div>

        {(trend || trendValue) && (
          <div className="flex items-center gap-2 pt-4 border-t-2 border-slate-200">
            {trend && (
              <span className={`flex items-center gap-1.5 text-sm font-bold ${
                trend === 'up' ? 'text-success-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? <FiTrendingUp size={18} className="animate-pulse" /> : <FiTrendingDown size={18} />}
              </span>
            )}
            <span className="text-sm font-semibold text-slate-600">{trendValue}</span>
          </div>
        )}

        {/* Decorative dot */}
        <div className="absolute bottom-4 left-6 w-2 h-2 rounded-full bg-primary-500 opacity-60"></div>
      </div>
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

