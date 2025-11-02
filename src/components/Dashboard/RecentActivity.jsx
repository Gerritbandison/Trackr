import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPackage,
  FiUsers,
  FiKey,
  FiEdit,
  FiTrash2,
  FiUserPlus,
  FiRefreshCw,
  FiClock,
} from 'react-icons/fi';
import { format } from 'date-fns';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      type: 'asset_assigned',
      icon: FiUserPlus,
      user: 'John Smith',
      action: 'assigned',
      resource: 'MacBook Pro 16"',
      resourceType: 'asset',
      resourceId: '123',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      color: 'blue',
    },
    {
      id: 2,
      type: 'license_created',
      icon: FiKey,
      user: 'Gerrit Johnson',
      action: 'created',
      resource: 'Microsoft 365 E5',
      resourceType: 'license',
      resourceId: '456',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      color: 'purple',
    },
    {
      id: 3,
      type: 'asset_updated',
      icon: FiEdit,
      user: 'Mike Davis',
      action: 'updated',
      resource: 'Dell XPS 15',
      resourceType: 'asset',
      resourceId: '789',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      color: 'green',
    },
    {
      id: 4,
      type: 'user_created',
      icon: FiUsers,
      user: 'Admin',
      action: 'created',
      resource: 'Emily Chen',
      resourceType: 'user',
      resourceId: '101',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      color: 'orange',
    },
    {
      id: 5,
      type: 'license_assigned',
      icon: FiKey,
      user: 'John Smith',
      action: 'assigned license',
      resource: 'Adobe Creative Cloud',
      resourceType: 'license',
      resourceId: '202',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      color: 'purple',
    },
  ];

  const getActivityIcon = (type) => {
    const iconMap = {
      asset_assigned: FiUserPlus,
      asset_updated: FiEdit,
      asset_deleted: FiTrash2,
      license_created: FiKey,
      license_assigned: FiKey,
      user_created: FiUsers,
      user_updated: FiEdit,
    };
    return iconMap[type] || FiRefreshCw;
  };

  const getActivityColor = (color) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-600';
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return format(timestamp, 'MMM dd, yyyy');
  };

  return (
    <div className="card">
      <div className="card-header bg-gradient-to-r from-blue-50 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <FiClock className="text-blue-600" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary-900">Recent Activity</h3>
            <p className="text-sm text-secondary-600">Latest changes and updates</p>
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <Link
                key={activity.id}
                to={`/${activity.resourceType}s/${activity.resourceId}`}
                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${getActivityColor(activity.color)} flex-shrink-0`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{activity.user}</span>{' '}
                    <span className="text-gray-600">{activity.action}</span>{' '}
                    <span className="font-medium">{activity.resource}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <FiClock size={12} />
                    {getRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link
            to="/audit-logs"
            className="flex items-center justify-center gap-2 text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors"
          >
            View Full Activity Log
            <FiRefreshCw size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;

