import { FiPackage, FiKey, FiUser, FiEdit, FiTrash2, FiUserPlus } from 'react-icons/fi';

/**
 * Activity timeline component
 */
const ActivityTimeline = ({ activities = [] }) => {
  const getIcon = (actionType) => {
    switch (actionType) {
      case 'create':
        return <FiPackage className="text-green-600" />;
      case 'update':
      case 'edit':
        return <FiEdit className="text-blue-600" />;
      case 'delete':
        return <FiTrash2 className="text-red-600" />;
      case 'assign':
        return <FiUserPlus className="text-purple-600" />;
      default:
        return <FiPackage className="text-gray-600" />;
    }
  };

  const getColor = (actionType) => {
    switch (actionType) {
      case 'create':
        return 'border-green-500 bg-green-50';
      case 'update':
      case 'edit':
        return 'border-blue-500 bg-blue-50';
      case 'delete':
        return 'border-red-500 bg-red-50';
      case 'assign':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200" />

      {/* Timeline items */}
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity._id || index} className="relative flex gap-4">
            {/* Icon */}
            <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full border-2 ${getColor(activity.actionType)} flex items-center justify-center`}>
              {getIcon(activity.actionType)}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{activity.description || activity.targetName}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.user?.name || 'System'} • {activity.targetType}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>

                {activity.details && (
                  <p className="text-sm text-gray-600 mt-2">{activity.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityTimeline;

