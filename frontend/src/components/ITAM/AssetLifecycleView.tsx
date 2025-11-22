/**
 * Asset Lifecycle View Component
 * 
 * Displays asset lifecycle with state history and timeline
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiClock, FiUser, FiMapPin, FiShield, FiPackage } from 'react-icons/fi';
import { assetsAPI } from '../../config/api';
import { ITAMAsset, AssetState } from '../../types/itam';
import { getStateDisplay, STATE_METADATA } from '../../utils/assetStateMachine';
import { format } from 'date-fns';

interface AssetLifecycleViewProps {
  asset: ITAMAsset;
}

interface LifecycleEvent {
  state: AssetState;
  timestamp: string;
  reason?: string;
  performedBy?: string;
}

const AssetLifecycleView: React.FC<AssetLifecycleViewProps> = ({ asset }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['asset', asset.globalAssetId, 'history'],
    queryFn: () => assetsAPI.getHistory(asset.globalAssetId),
    enabled: !!asset.globalAssetId,
  });

  const currentStateDisplay = getStateDisplay(asset.state);

  // Build lifecycle events from history
  const lifecycleEvents: LifecycleEvent[] = history?.data || [
    {
      state: asset.state,
      timestamp: asset.updatedAt || asset.createdAt || new Date().toISOString(),
      performedBy: asset.updatedBy || asset.createdBy,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current State Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Current State</h3>
            <div className={`px-4 py-2 rounded-full text-sm font-medium bg-${currentStateDisplay.color}-100 text-${currentStateDisplay.color}-800`}>
              {currentStateDisplay.label}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <FiUser className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Owner</div>
                <div className="font-medium text-gray-900">
                  {asset.owner?.displayName || asset.owner?.upn || 'Unassigned'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FiMapPin className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Location</div>
                <div className="font-medium text-gray-900">
                  {asset.location?.fullLocation || 
                   `${asset.location?.site || ''} ${asset.location?.room || ''}`.trim() || 
                   'Not specified'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FiShield className="text-gray-400" />
              <div>
                <div className="text-xs text-gray-500">Security</div>
                <div className="font-medium text-gray-900">
                  {asset.security?.edr || 'Not configured'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lifecycle Timeline */}
      <div className="card">
        <div className="card-body">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lifecycle Timeline</h3>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading history...</div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Timeline events */}
              <div className="space-y-6">
                {lifecycleEvents.map((event, index) => {
                  const stateDisplay = getStateDisplay(event.state);
                  const isLatest = index === 0;
                  const date = new Date(event.timestamp);

                  return (
                    <div key={index} className="relative flex items-start gap-4">
                      {/* Timeline dot */}
                      <div
                        className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          isLatest
                            ? `bg-${stateDisplay.color}-100 border-${stateDisplay.color}-500`
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full bg-${stateDisplay.color}-500`}
                        />
                      </div>

                      {/* Event content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium bg-${stateDisplay.color}-100 text-${stateDisplay.color}-800`}
                            >
                              {stateDisplay.label}
                            </span>
                            {isLatest && (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FiClock className="w-3 h-3" />
                            {format(date, 'MMM dd, yyyy HH:mm')}
                          </div>
                        </div>

                        {event.reason && (
                          <div className="text-sm text-gray-600 mb-2">{event.reason}</div>
                        )}

                        {event.performedBy && (
                          <div className="text-xs text-gray-500">
                            By: {event.performedBy}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetLifecycleView;

