import { FiInbox } from 'react-icons/fi';

/**
 * Premium empty state component for when no data is available
 */
const EmptyState = ({ 
  icon: Icon = FiInbox, 
  title = 'No data found', 
  description = 'Try adjusting your filters or create a new item',
  action,
  actionLabel = 'Create New',
}) => {
  return (
    <div className="text-center py-20">
      {/* Icon Container with Premium Styling */}
      <div className="relative inline-flex items-center justify-center mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl blur-xl opacity-50"></div>
        <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-primary-50 via-cyan-50 to-primary-50 border-2 border-primary-200 shadow-lg">
          <Icon className="text-primary-600" size={48} strokeWidth={1.5} />
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-accent-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-success-500 rounded-full border-2 border-white shadow-lg"></div>
      </div>

      {/* Content */}
      <h3 className="text-3xl font-bold text-slate-900 mb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
        {title}
      </h3>
      <p className="text-base text-slate-600 mb-8 max-w-md mx-auto font-medium">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <button 
          onClick={action} 
          className="btn btn-primary inline-flex items-center gap-2 group"
        >
          <span>{actionLabel}</span>
          <svg 
            className="w-5 h-5 group-hover:translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      )}

      {/* Decorative Elements */}
      <div className="mt-12 flex items-center justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary-300 animate-pulse"></div>
        <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 rounded-full bg-primary-300 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
      </div>
    </div>
  );
};

export default EmptyState;

