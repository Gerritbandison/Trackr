import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiActivity, FiPackage, FiKey, FiUser, FiEdit, FiTrash2 } from 'react-icons/fi';
import { auditLogsAPI } from '../../config/api';
import LoadingSpinner from './LoadingSpinner';

/**
 * Real-time activity feed component
 */
const ActivityFeed = ({ limit = 10, refreshInterval = 30000 }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['activity-feed', limit],
    queryFn: () => auditLogsAPI.getAll({ limit, sort: '-createdAt' }).then(res => res.data.data),
    refetchInterval: refreshInterval,
  });

  const getIcon = (actionType, targetType) => {
    if (targetType === 'asset') return FiPackage;
    if (targetType === 'license') return FiKey;
    if (targetType === 'user') return FiUser;
    
    switch (actionType) {
      case 'create':
        return FiPackage;
      case 'update':
        return FiEdit;
      case 'delete':
        return FiTrash2;
      default:
        return FiActivity;
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'create':
        return 'text-green-600 bg-green-50';
      case 'update':
        return 'text-blue-600 bg-blue-50';
      case 'delete':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (isLoading) return <LoadingSpinner />;

  const activities = data || [];

  return (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FiActivity size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        activities.map((activity) => {
          const Icon = getIcon(activity.actionType, activity.targetType);
          return (
            <div
              key={activity._id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
            >
              <div className={`p-2 rounded-lg ${getActionColor(activity.actionType)}`}>
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  <span className="font-semibold">{activity.user?.name || 'System'}</span>{' '}
                  <span className="text-gray-600 dark:text-gray-400">{activity.actionType}</span>{' '}
                  <Link
                    to={`/${activity.targetType}s/${activity.targetId}`}
                    className="font-medium text-primary-600 hover:text-primary-700"
                  >
                    {activity.targetName}
                  </Link>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                  {getTimeAgo(activity.createdAt)}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ActivityFeed;

