import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiBell, FiX, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { notificationsAPI } from '../../config/api';
import toast from 'react-hot-toast';

const NotificationPanel = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', showUnreadOnly],
    queryFn: () =>
      notificationsAPI
        .getAll({ unreadOnly: showUnreadOnly })
        .then((res) => res.data),
    enabled: isOpen,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('All notifications marked as read');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => notificationsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Notification deleted');
    },
  });

  const handleMarkAsRead = (id) => {
    markAsReadMutation.mutate(id);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = (type) => {
    const iconClass = 'text-lg';
    switch (type) {
      case 'asset_assigned':
      case 'asset_unassigned':
        return '📦';
      case 'license_assigned':
      case 'license_expiring':
        return '🔑';
      case 'warranty_expiring':
        return '⚠️';
      case 'low_stock':
        return '📉';
      case 'system_alert':
        return '🔔';
      case 'onboarding_task':
        return '✅';
      default:
        return '📬';
    }
  };

  if (!isOpen) return null;

  const notifications = data?.data || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiBell size={24} />
            <div>
              <h3 className="font-bold text-lg">Notifications</h3>
              <p className="text-xs text-white/80">
                {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="unreadOnly"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="rounded text-primary-600"
            />
            <label htmlFor="unreadOnly" className="text-sm text-gray-700 cursor-pointer">
              Show unread only
            </label>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              disabled={markAllAsReadMutation.isLoading}
            >
              <FiCheckCircle className="inline mr-1" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <FiBell size={48} className="mb-4 opacity-50" />
              <p className="font-medium">No notifications</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border-l-4 transition-colors ${
                    notification.read ? 'bg-white' : getPriorityColor(notification.priority)
                  } hover:bg-gray-50`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`font-semibold text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full mt-1 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className={`text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    {!notification.read && (
                      <button
                        onClick={() => handleMarkAsRead(notification._id)}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                        disabled={markAsReadMutation.isLoading}
                      >
                        <FiCheck size={14} />
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                      disabled={deleteMutation.isLoading}
                    >
                      <FiX size={14} />
                      Delete
                    </button>
                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-auto"
                        onClick={onClose}
                      >
                        View →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NotificationPanel;

