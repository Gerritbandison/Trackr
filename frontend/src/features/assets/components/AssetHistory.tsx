import { useQuery } from '@tanstack/react-query';
import { FiActivity, FiEdit, FiUserPlus, FiUserMinus, FiTrash2, FiPackage } from 'react-icons/fi';
import { IconType } from 'react-icons';
import { auditLogsAPI } from '../../../config/api';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { format } from 'date-fns';

interface AssetHistoryProps {
  assetId: string;
}

interface AuditLog {
  _id: string;
  action: string;
  actionType: string;
  timestamp: string;
  user: {
    name: string;
    email: string;
  };
  changes?: Record<string, { old: any; new: any }>;
  metadata?: Record<string, any>;
}

/**
 * Asset history/audit trail component
 */
const AssetHistory = ({ assetId }: AssetHistoryProps) => {
  const { data, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['asset-history', assetId],
    queryFn: () => auditLogsAPI.getResourceLogs('asset', assetId).then((res) => res.data.data),
    enabled: !!assetId,
  });

  const getIcon = (actionType: string): IconType => {
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

  const getActionColor = (actionType: string): string => {
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

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <FiActivity className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-600">No history available for this asset</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">Asset History</h3>
        <p className="text-sm text-gray-500">Audit trail of all changes to this asset</p>
      </div>
      <div className="card-body">
        <div className="space-y-4">
          {data.map((log) => {
            const Icon = getIcon(log.actionType);
            const colorClass = getActionColor(log.actionType);

            return (
              <div
                key={log._id}
                className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 capitalize">
                        {log.action || log.actionType}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
                        {log.actionType}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  {log.user && (
                    <p className="text-sm text-gray-600">
                      by {log.user.name || log.user.email}
                    </p>
                  )}
                  {log.changes && Object.keys(log.changes).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(log.changes).map(([field, change]) => (
                        <div key={field} className="text-xs text-gray-600">
                          <span className="font-medium">{field}:</span>{' '}
                          <span className="line-through text-red-600">
                            {change.old !== null && change.old !== undefined
                              ? String(change.old)
                              : 'N/A'}
                          </span>{' '}
                          →{' '}
                          <span className="text-green-600">
                            {change.new !== null && change.new !== undefined
                              ? String(change.new)
                              : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AssetHistory;

