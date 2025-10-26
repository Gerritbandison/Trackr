const Badge = ({ children, variant = 'gray', size = 'md' }) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-700 border border-red-200',
    info: 'bg-blue-50 text-blue-700 border border-blue-200',
    gray: 'bg-secondary-50 text-secondary-700 border border-secondary-200',
    primary: 'bg-primary-50 text-primary-700 border border-primary-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold capitalize ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

export default Badge;

// Helper function to get status badge variant
export const getStatusVariant = (status) => {
  const statusMap = {
    active: 'success',
    available: 'success',
    assigned: 'info',
    inactive: 'gray',
    repair: 'warning',
    retired: 'gray',
    expired: 'danger',
    cancelled: 'gray',
    lost: 'danger',
    disposed: 'gray',
  };
  return statusMap[status?.toLowerCase()] || 'gray';
};

// Helper for condition badge
export const getConditionVariant = (condition) => {
  const conditionMap = {
    excellent: 'success',
    good: 'info',
    fair: 'warning',
    poor: 'danger',
    damaged: 'danger',
  };
  return conditionMap[condition?.toLowerCase()] || 'gray';
};

