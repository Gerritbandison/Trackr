import { memo } from 'react';

/**
 * Badge Component
 * 
 * A reusable badge component for displaying status, labels, and tags.
 * Optimized with React.memo for performance.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to display inside the badge
 * @param {('success'|'warning'|'danger'|'info'|'gray'|'primary')} [props.variant='gray'] - Visual variant of the badge
 * @param {('sm'|'md'|'lg')} [props.size='md'] - Size of the badge
 * @returns {JSX.Element} Badge component
 */
const Badge = memo(({ children, variant = 'gray', size = 'md' }) => {
  const variants = {
    success: 'bg-gradient-to-r from-success-50 to-emerald-50 text-success-700 border-2 border-success-200 font-bold shadow-sm',
    warning: 'bg-gradient-to-r from-accent-50 to-amber-50 text-accent-700 border-2 border-accent-200 font-bold shadow-sm',
    danger: 'bg-gradient-to-r from-red-50 to-red-50 text-red-700 border-2 border-red-200 font-bold shadow-sm',
    info: 'bg-gradient-to-r from-primary-50 to-blue-50 text-primary-700 border-2 border-primary-200 font-bold shadow-sm',
    gray: 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border-2 border-slate-200 font-bold shadow-sm',
    primary: 'bg-gradient-to-r from-primary-50 to-cyan-50 text-primary-700 border-2 border-primary-200 font-bold shadow-sm',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1',
    md: 'text-xs px-3.5 py-1.5',
    lg: 'text-sm px-4 py-2',
  };

  return (
    <span className={`inline-flex items-center rounded-full capitalize ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;

/**
 * Helper function to get the appropriate badge variant for a status
 * 
 * @param {string} status - The status value (e.g., 'active', 'available', 'expired')
 * @returns {('success'|'warning'|'danger'|'info'|'gray')} The badge variant to use
 * @example
 * const variant = getStatusVariant('active'); // Returns 'success'
 */
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

/**
 * Helper function to get the appropriate badge variant for a condition
 * 
 * @param {string} condition - The condition value (e.g., 'excellent', 'good', 'poor')
 * @returns {('success'|'warning'|'danger'|'info'|'gray')} The badge variant to use
 * @example
 * const variant = getConditionVariant('excellent'); // Returns 'success'
 */
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

