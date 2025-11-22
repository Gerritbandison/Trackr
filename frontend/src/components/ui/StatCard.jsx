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
    <div className="group relative overflow-hidden bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200 hover:border-primary-300/50 shadow-soft hover:shadow-glow transition-all duration-300 hover:-translate-y-1">
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-40 h-40 opacity-[0.03] transform translate-x-12 -translate-y-12 group-hover:opacity-[0.08] transition-opacity duration-500 rotate-12">
        {Icon && <Icon size={160} strokeWidth={1.5} />}
      </div>

      {/* Gradient overlay on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentColor.bg} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>

      {/* Shine Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"></div>
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 relative z-10">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              {title}
              <span className={`w-1.5 h-1.5 rounded-full ${currentColor.bg} opacity-60`}></span>
            </p>
            <p className="text-5xl font-bold text-slate-900 tracking-tight drop-shadow-sm">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={`relative w-16 h-16 rounded-2xl ${currentColor.bg} flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
              <Icon size={28} className="text-white drop-shadow-md" strokeWidth={2.5} />
              <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute -inset-1 rounded-2xl bg-white/30 blur-lg opacity-0 group-hover:opacity-50 transition-opacity"></div>
            </div>
          )}
        </div>

        {(trend || trendValue) && (
          <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
            {trend && (
              <span className={`flex items-center gap-1.5 text-sm font-bold px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                {trend === 'up' ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
                {trend === 'up' ? '+' : ''}
              </span>
            )}
            <span className="text-sm font-semibold text-slate-600">{trendValue}</span>
          </div>
        )}
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

