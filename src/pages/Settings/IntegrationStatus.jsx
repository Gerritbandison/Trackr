import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiRefreshCw, FiCheck, FiClock, FiAlertCircle, FiDatabase } from 'react-icons/fi';
import { integrationsAPI } from '../../config/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const IntegrationStatus = () => {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState({ intune: false, lansweeper: false });

  // Fetch sync status
  const { data: statusData, isLoading } = useQuery({
    queryKey: ['integration-status'],
    queryFn: () => integrationsAPI.getSyncStatus().then(res => res.data.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch synced devices
  const { data: devicesData } = useQuery({
    queryKey: ['synced-devices'],
    queryFn: () => integrationsAPI.getSyncedDevices().then(res => res.data.data),
  });

  // Trigger sync mutation
  const triggerSyncMutation = useMutation({
    mutationFn: (source) => integrationsAPI.triggerSync(source),
    onSuccess: (data, source) => {
      setSyncing({ ...syncing, [source]: false });
      toast.success(`${source.charAt(0).toUpperCase() + source.slice(1)} sync triggered successfully`);
      // Refresh data after a short delay to allow backend processing
      setTimeout(() => {
        queryClient.invalidateQueries(['integration-status']);
        queryClient.invalidateQueries(['synced-devices']);
      }, 2000);
    },
    onError: (error, source) => {
      setSyncing({ ...syncing, [source]: false });
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Failed to trigger ${source} sync: ${errorMessage}`);
      console.error('Sync error:', error);
    },
  });

  const handleSync = (source) => {
    setSyncing({ ...syncing, [source]: true });
    triggerSyncMutation.mutate(source);
  };

  if (isLoading) return <LoadingSpinner />;

  const intune = statusData?.intune || {};
  const lansweeper = statusData?.lansweeper || {};
  const devices = devicesData || [];

  const getTimeAgo = (date) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FiDatabase className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-semibold text-blue-900">Integration Sync Status</h3>
            <p className="text-xs text-blue-800 mt-1">
              This page shows the sync status for Intune and Lansweeper integrations. 
              Click "Sync Now" to manually trigger a sync, or use the test script in the backend to simulate device data.
            </p>
            <p className="text-xs text-blue-800 mt-2 font-mono bg-blue-100 px-2 py-1 rounded inline-block">
              Backend: node test-integration-sync.js
            </p>
          </div>
        </div>
      </div>

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Intune Status */}
        <div className="card border-l-4 border-blue-500">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <span className="text-2xl">🔷</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Microsoft Intune</h3>
                  <p className="text-xs text-gray-600">MDM & Device Management</p>
                </div>
              </div>
              {intune.enabled && (
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" title="Active" />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Sync</span>
                <span className="font-semibold text-gray-900">{getTimeAgo(intune.lastSync)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Devices Synced</span>
                <span className="font-bold text-blue-600 text-lg">{intune.deviceCount || 0}</span>
              </div>
            </div>

            <button
              onClick={() => handleSync('intune')}
              disabled={syncing.intune}
              className="w-full mt-4 btn btn-primary flex items-center justify-center gap-2"
            >
              <FiRefreshCw className={syncing.intune ? 'animate-spin' : ''} />
              {syncing.intune ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {/* Lansweeper Status */}
        <div className="card border-l-4 border-green-500">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Lansweeper</h3>
                  <p className="text-xs text-gray-600">Network Discovery</p>
                </div>
              </div>
              {lansweeper.enabled && (
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" title="Active" />
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Last Scan</span>
                <span className="font-semibold text-gray-900">{getTimeAgo(lansweeper.lastSync)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Devices Found</span>
                <span className="font-bold text-green-600 text-lg">{lansweeper.deviceCount || 0}</span>
              </div>
            </div>

            <button
              onClick={() => handleSync('lansweeper')}
              disabled={syncing.lansweeper}
              className="w-full mt-4 btn btn-primary flex items-center justify-center gap-2"
            >
              <FiRefreshCw className={syncing.lansweeper ? 'animate-spin' : ''} />
              {syncing.lansweeper ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Synced Devices List */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Synced Devices ({devices.length})</h3>
            <div className="flex items-center gap-2">
              <FiDatabase className="text-primary-600" />
              <span className="text-sm text-gray-600">Real-time from Intune & Lansweeper</span>
            </div>
          </div>
        </div>
        <div className="card-body">
          {devices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiDatabase size={48} className="mx-auto mb-4 opacity-30" />
              <p>No devices synced yet</p>
              <p className="text-sm mt-2">Click "Sync Now" to import devices</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Device</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Source</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Asset</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Synced</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-gray-900">{device.deviceName}</p>
                          <p className="text-xs text-gray-600 font-mono">{device.serialNumber}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          device.source === 'intune' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {device.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {device.assignedUser?.name || device.upn || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {device.linkedAsset ? (
                          <span className="text-primary-600 font-medium">{device.linkedAsset.name}</span>
                        ) : (
                          <span className="text-gray-400">Not linked</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {getTimeAgo(device.lastSyncedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationStatus;

