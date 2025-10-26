import { FiInbox } from 'react-icons/fi';

/**
 * Empty state component for when no data is available
 */
const EmptyState = ({ 
  icon: Icon = FiInbox, 
  title = 'No data found', 
  description = 'Try adjusting your filters or create a new item',
  action,
  actionLabel = 'Create New',
}) => {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
        <Icon className="text-gray-400" size={40} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <button onClick={action} className="btn btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

