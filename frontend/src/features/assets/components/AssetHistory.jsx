import { useQuery } from '@tanstack/react-query';
import { FiActivity, FiEdit, FiUserPlus, FiUserMinus, FiTrash2, FiPackage } from 'react-icons/fi';
import { auditLogsAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

/**
 * Asset history/audit trail component
 */
const AssetHistory = ({ assetId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['asset-history', assetId],
    queryFn: () => auditLogsAPI.getResourceLogs('asset', assetId).then((res) => res.data.data),
    enabled: !!assetId,
  });

  const getIcon = (actionType) => {
    switch (actionType) {
      case 'create':
        return FiPackage;
      case 'update':
        return FiEdit;
      case 'delete':
        return FiTrash2;
      case 'assign':
        return FiUserPlus;
      case 'unassign':
        return FiUserMinus;
      default:
        return FiActivity;
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'create':
        return 'bg-green-100 text-green-600';
      case 'update':
        return 'bg-blue-100 text-blue-600';
      case 'delete':
        return 'bg-red-100 text-red-600';
      case 'assign':
        return 'bg-purple-100 text-purple-600';
      case 'unassign':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getActionLabel = (actionType) => {
    switch (actionType) {
      case 'create':
        return 'Created';
      case 'update':
        return 'Updated';
      case 'delete':
        return 'Deleted';
      case 'assign':
        return 'Assigned';
      case 'unassign':
        return 'Unassigned';
      default:
        return actionType;
    }
  };

  if (isLoading) return <LoadingSpinner />;

  const logs = data || [];

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FiActivity className="mx-auto mb-3 text-gray-300" size={48} />
        <p>No history available for this asset</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log, index) => {
        const Icon = getIcon(log.actionType);
        return (
          <div key={log._id} className="flex gap-4 group hover:bg-gray-50 rounded-lg p-3 transition-colors">
            {/* Timeline Line */}
            {index < logs.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>
            )}

            {/* Icon */}
            <div className={`relative z-10 w-10 h-10 rounded-xl ${getActionColor(log.actionType)} flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-gray-900">{getActionLabel(log.actionType)}</h4>
                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                  {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>

              {log.user && (
                <p className="text-sm text-gray-600">
                  by <span className="font-medium">{log.user.name}</span>
                  {log.user.email && <span className="text-gray-500"> ({log.user.email})</span>}
                </p>
              )}

              {log.changes && Object.keys(log.changes).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <details className="cursor-pointer">
                    <summary className="text-sm text-primary-600 hover:text-primary-700">
                      View {Object.keys(log.changes).length} change{Object.keys(log.changes).length !== 1 ? 's' : ''}
                    </summary>
                    <div className="mt-2 space-y-1">
                      {Object.entries(log.changes).map(([field, { old: oldValue, new: newValue }]) => (
                        <div key={field} className="text-xs bg-gray-50 rounded p-2">
                          <span className="font-semibold text-gray-700 capitalize">
                            {field.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="line-through text-red-600">{String(oldValue || 'N/A')}</span>
                            <span className="text-gray-400">→</span>
                            <span className="text-green-600 font-medium">{String(newValue || 'N/A')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {log.notes && (
                <p className="text-sm text-gray-600 mt-2 italic">"{log.notes}"</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AssetHistory;

